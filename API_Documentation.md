# EkaCS API Production Documentation

This document provides a comprehensive technical reference for the EkaCS Backend API. All endpoints follow a standard response format and use strict Joi validation.

## Base URL
`{{base_url}}` (e.g., `http://localhost:3000/api/v1`)

## Global Response Format
All API responses are wrapped in a standard `ApiResponse` object:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

## Authentication
Endpoints marked with ✅ require a Bearer Token:
`Authorization: Bearer <your_jwt_token>`

---

## 1. Auth Module (`/auth`)
Handles identity and session management.

| Endpoint | Method | Auth | Input Schema | Description |
| :--- | :--- | :---: | :--- | :--- |
| `/register` | POST | ❌ | `email*`, `password*`, `companyName*` | Register a new company account. |
| `/login` | POST | ❌ | `email*`, `password*` | Authenticate and receive session cookies. |
| `/refresh` | POST | ❌ | *(RefreshToken cookie)* | Generate a new access token. |
| `/logout` | POST | ✅ | - | Terminate current session. |
| `/forgot-password`| POST | ❌ | `email*` | Request password reset link. |
| `/reset-password` | POST | ❌ | `token*`, `password*` | Complete password reset. |
| `/change-password`| POST | ✅ | `oldPassword*`, `newPassword*` | Update password for active user. |
| `/verify-email` | GET | ❌ | `?token=*` (Query) | Confirm email ownership. |

---

## 2. Company Module (`/company`)
Core profile and discovery engine.

| Endpoint | Method | Auth | Input Example | Description |
| :--- | :--- | :---: | :--- | :--- |
| `/me` | GET | ✅ | - | Get private profile data. |
| `/me` | PUT | ✅ | Form-Data: `pfp`, `banner`, `name`, `bio`, `industry[]` | Update profile with validation. |
| `/discover` | GET | ✅ | `?page=1&limit=20&country=US` | Paginated discovery list. |
| `/browse` | POST | ✅ | `{"search": "query", "limit": 20}` | Advanced search and filtering. |
| `/:id` | GET | ✅ | `id` (Param) | Get public profile by ID. |
| `/save/:id` | PATCH | ✅ | `id` (Param) | Toggle save status of a company. |

---

## 3. Project Module (`/project`)
Project workflow and collaboration.

| Endpoint | Method | Auth | Input Example | Description |
| :--- | :--- | :---: | :--- | :--- |
| `/get-projects` | GET | ✅ | `?page=1&limit=20` | List user involved projects. |
| `/get-project/:id`| GET | ✅ | `id` (Param) | Get specific project details. |
| `/create-project-request` | POST | ✅ | `partnerId*`, `name*`, `description*` | Initiate a project request. |
| `/accept-project/:id` | PATCH | ✅ | `id` (Param) | Formalize project acceptance. |
| `/snooze-project/:id` | PATCH | ✅ | `snoozeDate*` (Body) | Postpone project timeline. |
| `/update-project/:id` | PUT | ✅ | `description`, `budget`, `progress` | Update project metadata. |

---

## 4. Content Module (`/content`)
Media and feed management.

| Endpoint | Method | Auth | Input Example | Description |
| :--- | :--- | :---: | :--- | :--- |
| `/create-content` | POST | ✅ | Form-Data: `image`, `title*`, `type*` | Post new content to feed. |
| `/update-content/:id` | PUT | ✅ | Form-Data: `image`, `title` | Modify existing content. |
| `/feed` | GET | ✅ | - | Retrieve social feed. |
| `/like-content/:id`| PATCH | ✅ | `id` (Param) | Toggle like on content. |
| `/save-content/:id`| PATCH | ✅ | `id` (Param) | Save content to favorites. |

---

## 5. Message Module (`/message`)
Direct communication layer.

| Endpoint | Method | Auth | Input Example | Description |
| :--- | :--- | :---: | :--- | :--- |
| `/get-conversations` | GET | ✅ | - | Aggregate view of active chats. |
| `/get-conversation/:id` | GET | ✅ | `id` (Param) | Fetch full message history. |
| `/send-message` | POST | ✅ | `receiverId*`, `message*` | Send a direct message. |
| `/mark-as-read/:id` | PATCH | ✅ | `id` (Param) | Update read status. |

---

## 6. General Module (`/general`)
Utilities and Administrative controls.

| Endpoint | Method | Auth | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| `/send-message` | POST | ❌ | All | Contact/Support form submission. |
| `/get-communities`| GET | ✅ | All | List events/contest/rfps. |
| `/create-community`| POST | ✅ | Admin | Post new community event. |
| `/get-faqs` | GET | ❌ | All | List active FAQs. |
| `/create-faq` | POST | ✅ | Admin | Define new FAQ entry. |
| `/dashboard` | GET | ✅ | All | Fetch overview statistics. |

---

## 7. Notification Module (`/notification`)
Real-time alerts.

| Endpoint | Method | Auth | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| `/get-notifications`| GET | ✅ | All | Fetch user inbox. |
| `/mark-all-as-read` | PATCH | ✅ | All | Clear unread status. |
| `/create-notification`| POST | ✅ | Admin | Trigger system alert. |
