// Run against the local development API; only creates/deletes uniquely named test todos.
import assert from 'node:assert/strict'
const base = process.env.TEST_API_URL || 'http://localhost:3001'
const created = []
async function request(path, method = 'GET', body, token) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: response.status, data: response.status === 204 ? undefined : await response.json() }
}
const login = await request('/api/auth/login', 'POST', { email: 'n@lianmian.dev', password: 'n1234' })
assert.equal(login.status, 200, 'development seed user login')
const token = login.data.token
const other = await request('/api/auth/login', 'POST', { email: 'v@lianmian.dev', password: 'v1234' })
assert.equal(other.status, 200)
try {
  const projects = await request('/api/projects', 'GET', undefined, token)
  assert.equal(projects.status, 200)
  assert.ok(projects.data.length, 'seed user has a project for association checks')
  const projectId = projects.data[0].id
  const result = await request('/api/todos', 'POST', { title: `CRUD CHECK ${Date.now()}`, priority: 'low' }, token)
  assert.equal(result.status, 201)
  const id = result.data.id
  created.push(id)
  assert.equal(result.data.userId, login.data.user.id)
  assert.equal(result.data.projectId, undefined, 'independent todo')
  let updated = await request(`/api/todos/${id}`, 'PATCH', { projectId, status: 'doing', dueDate: '2026-09-07' }, token)
  assert.equal(updated.status, 200)
  assert.equal(updated.data.projectId, projectId)
  assert.equal(updated.data.status, 'doing')
  updated = await request(`/api/todos/${id}`, 'PATCH', { projectId: null, dueDate: null }, token)
  assert.equal(updated.status, 200)
  assert.equal(updated.data.projectId, undefined, 'unlink project')
  assert.equal(updated.data.dueDate, undefined, 'clear date')
  assert.equal((await request(`/api/todos/${id}`, 'GET', undefined, token)).data.projectId, undefined, 'persisted unlink')
  assert.equal((await request(`/api/todos/${id}`, 'DELETE', undefined, other.data.token)).status, 404, 'other user cannot delete')
  assert.equal((await request(`/api/todos/${id}`, 'PATCH', { title: 'forbidden' }, other.data.token)).status, 404)
  assert.equal((await request(`/api/todos/${id}`, 'PATCH', { projectId: 'missing-project' }, token)).status, 400)
  assert.equal((await request('/api/todos', 'POST', { title: ' ' }, token)).status, 400)
  assert.equal((await request(`/api/todos/${id}`, 'PATCH', { status: 'invalid' }, token)).status, 400)
  const linked = await request('/api/todos', 'POST', { title: `CRUD LINKED ${Date.now()}`, projectId }, token)
  assert.equal(linked.status, 201)
  created.push(linked.data.id)
  assert.equal(linked.data.projectId, projectId)
  const comment = await request(`/api/todos/${id}/comments`, 'POST', { body: 'temporary CRUD test comment' }, token)
  assert.equal(comment.status, 201)
  assert.equal((await request(`/api/todos/${id}/comments`, 'GET', undefined, other.data.token)).status, 404, 'nested read respects owner')
  assert.equal((await request(`/api/todos/${id}/comments`, 'POST', { body: 'forbidden' }, other.data.token)).status, 404)
  await request(`/api/todos/${linked.data.id}/comments/${comment.data.id}`, 'DELETE', undefined, token)
  assert.equal((await request(`/api/todos/${id}/comments`, 'GET', undefined, token)).data.length, 1, 'wrong task cannot delete comment')
  assert.equal((await request('/api/todos', 'POST', { title: 'forbidden project', projectId }, other.data.token)).status, 400, 'project owner checked')
  assert.equal((await request(`/api/todos/${id}`, 'DELETE', undefined, token)).status, 204)
  assert.equal((await request(`/api/todos/${id}`, 'GET', undefined, token)).status, 404, 'database deletion persisted')
  assert.equal((await request(`/api/todos/${id}`, 'DELETE', undefined, token)).status, 404, 'no false deletion success')
  console.log('PASS: create independent/linked todos, read, associate/unlink, update status/date, validation, owner permissions, persistent deletion')
} finally {
  for (const id of created) {
    const result = await request(`/api/todos/${id}`, 'DELETE', undefined, token)
    assert.ok([204, 404].includes(result.status), 'test record cleanup')
  }
}
