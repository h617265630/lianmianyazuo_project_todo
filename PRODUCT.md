# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vue 3 + Vite + Tailwind CSS (frontend SPA) · Express + Drizzle ORM + PostgreSQL (backend API)

## Users

开发者和技术工作者，以个人或小团队为单位使用。用于管理个人项目、资料、笔记和信息的全能工作台。

## Product Purpose

连绵雅座是一个本地优先（local-first）的个人项目与资料管理工作台，帮助用户整理、跟踪和管理工作与学习中的各类信息资产。核心价值在于数据主权——用户的数据归用户所有，不依赖云服务即可完整使用。

## Positioning

本地优先与离线可用是该产品的核心差异化优势。相比 Notion、Obsidian、飞书等主流工具，连绵雅座强调数据完全由用户控制，可在本地运行，不强制依赖云端同步，适合对数据隐私和离线可用性有需求的开发者和技术工作者。

## Operating Context

- 个人开发者的日常工具，管理项目笔记、技术资料、学习记录
- 可能扩展为小团队内部使用（多用户架构已在规划中）
- 使用场景涵盖：知识整理、项目跟踪、资料归档、信息卡片化管理

## Capabilities and Constraints

- 已实现：Vue 3 前端SPA、Express API 后端、Drizzle ORM + PostgreSQL 数据库、多页面路由、Pinia 状态管理
- 进行中：多用户权限系统
- 技术约束：基于 PostgreSQL，需本地数据库环境运行
- 术语约定："连绵雅座"为产品名，需保持品牌一致性

## Brand Commitments

- 产品名称：连绵雅座（不可更改）
- 设计方向：开发者友好、工具感强、功能优先于装饰
- 暂无外部品牌素材约束（logo、配色等尚未固定）

## Evidence on Hand

- 现有代码库为功能完整的全栈应用框架，包含数据库 schema、API 路由、前端页面骨架
- 已有 lucide-vue-next 图标库依赖
- 已有 Tailwind CSS v4 和 PostCSS 配置
- README.md 描述为"个人项目与资料管理工作台"

## Product Principles

1. **数据主权**：用户数据归用户所有，本地优先，离线可用
2. **开发者友好**：技术栈清晰，代码可读，支持自部署
3. **功能驱动**：工具服务于效率，不为装饰牺牲性能
4. **渐进增强**：核心功能先行，高级功能按需扩展
