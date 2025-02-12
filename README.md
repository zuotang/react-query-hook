# react-query-hook
react 的请求插件的hook封装
以下是一个基于你提供的代码编写的文档，旨在帮助其他开发者理解和使用你封装的请求 Hook。

---

# React 请求封装文档

本文档介绍了如何使用 `useBaseFetch`、`useQuery` 和 `useAutoQuery` 这三个自定义 Hook 来管理数据请求、缓存和状态更新。这些 Hook 封装了常见的请求逻辑，提供了缓存管理、错误处理、自动请求等功能。

---

## 目录

1. [核心概念](#核心概念)
2. [API 文档](#api-文档)
   - [useBaseFetch](#usebasefetch)
   - [useQuery](#usequery)
   - [useAutoQuery](#useautoquery)
3. [缓存管理](#缓存管理)
4. [示例代码](#示例代码)
5. [注意事项](#注意事项)

---

## 核心概念

### 1. **请求封装**
   - `useBaseFetch` 是核心 Hook，负责处理请求、缓存、状态更新等逻辑。
   - `useQuery` 和 `useAutoQuery` 是基于 `useBaseFetch` 的高级封装，分别用于手动请求和自动请求。

### 2. **缓存管理**
   - 请求结果会被缓存，避免重复请求。
   - 缓存支持强制更新（`mandatory`）和手动清理（`clearCache`）。

### 3. **自动请求**
   - `useAutoQuery` 支持在组件挂载时自动发起请求，并可以根据参数变化重新请求。

### 4. **错误处理**
   - 请求失败时会触发 `onError` 回调，并更新错误状态。

---

## API 文档

### `useBaseFetch`

#### 功能
`useBaseFetch` 是一个底层 Hook，用于处理数据请求、缓存和状态管理。

#### 参数
| 参数名            | 类型       | 默认值       | 描述                                                                 |
|-------------------|------------|--------------|----------------------------------------------------------------------|
| `ql`              | `Function` | 无           | 请求函数，返回一个 Promise。                                         |
| `defaultParams`    | `Object`   | `{}`         | 默认请求参数。                                                       |
| `defaultData`      | `any`      | `null`       | 默认数据，用于初始化 `data` 状态。                                   |
| `isDefaultLoading` | `Boolean`  | `false`      | 是否默认处于加载状态。                                               |

#### 返回值
| 属性名        | 类型       | 描述                                                                 |
|---------------|------------|----------------------------------------------------------------------|
| `fetch`       | `Function` | 发起请求的函数，接受一个参数对象（覆盖 `defaultParams`）。           |
| `data`        | `any`      | 请求结果数据。                                                       |
| `loading`     | `Boolean`  | 是否正在加载。                                                       |
| `error`       | `any`      | 请求错误信息。                                                       |
| `destroy`     | `Function` | 销毁函数，用于取消请求（组件卸载时调用）。                           |
| `setError`    | `Function` | 手动设置错误信息。                                                   |
| `updateCache` | `Function` | 更新缓存数据的函数，接受一个回调函数（用于更新 `data` 状态）。       |

---

### `useQuery`

#### 功能
`useQuery` 是基于 `useBaseFetch` 的封装，提供了手动请求和缓存清理功能。

#### 参数
| 参数名         | 类型       | 默认值 | 描述                                                                 |
|----------------|------------|--------|----------------------------------------------------------------------|
| `ql`           | `Function` | 无     | 请求函数，返回一个 Promise。                                         |
| `defaultOption`| `Object`   | `{}`   | 默认请求参数，同 `useBaseFetch` 的 `defaultParams`。                 |

#### 返回值
| 属性名        | 类型       | 描述                                                                 |
|---------------|------------|----------------------------------------------------------------------|
| `fetch`       | `Function` | 发起请求的函数。                                                     |
| `data`        | `any`      | 请求结果数据。                                                       |
| `loading`     | `Boolean`  | 是否正在加载。                                                       |
| `error`       | `any`      | 请求错误信息。                                                       |
| `update`      | `Function` | 强制更新请求（清理缓存并重新请求）。                                 |

---

### `useAutoQuery`

#### 功能
`useAutoQuery` 是基于 `useBaseFetch` 的封装，支持自动请求和参数变化时重新请求。

#### 参数
| 参数名         | 类型       | 默认值 | 描述                                                                 |
|----------------|------------|--------|----------------------------------------------------------------------|
| `ql`           | `Function` | 无     | 请求函数，返回一个 Promise。                                         |
| `fetchParams`  | `Object`   | `{}`   | 请求参数，支持 `hold`（是否等待）和 `stop`（是否停止自动请求）。     |

#### 返回值
| 属性名        | 类型       | 描述                                                                 |
|---------------|------------|----------------------------------------------------------------------|
| `fetch`       | `Function` | 发起请求的函数。                                                     |
| `data`        | `any`      | 请求结果数据。                                                       |
| `loading`     | `Boolean`  | 是否正在加载。                                                       |
| `error`       | `any`      | 请求错误信息。                                                       |
| `fetchMore`   | `Function` | 发起更多请求的函数，支持合并参数和更新查询结果。                     |
| `update`      | `Function` | 强制更新请求（清理缓存并重新请求）。                                 |

---

## 缓存管理

### 1. **缓存机制**
   - 每个请求的结果会根据请求函数名称和参数生成唯一的缓存键，并存储在 `cacheCtx` 中。
   - 缓存数据包括请求状态（`fetching` 或 `fetched`）和请求结果。

### 2. **缓存操作**
   - **获取缓存**：`cacheCtx.getCache(ql, params)`
   - **设置缓存**：`cacheCtx.setCache(ql, params, res)`
   - **清理缓存**：`cacheCtx.clearCache(ql)`

---

## 示例代码

### 1. 使用 `useQuery`

```javascript
import { useQuery } from './hooks';

function fetchUser(params) {
  return axios.get('/api/user', { params });
}

function UserProfile({ userId }) {
  const { data, loading, error, update } = useQuery(fetchUser, { userId });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={update}>Refresh</button>
    </div>
  );
}
```

### 2. 使用 `useAutoQuery`

```javascript
import { useAutoQuery } from './hooks';

function fetchPosts(params) {
  return axios.get('/api/posts', { params });
}

function PostList({ category }) {
  const { data, loading, error, fetchMore } = useAutoQuery(fetchPosts, { category });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
      <button onClick={() => fetchMore({ page: 2 })}>Load More</button>
    </div>
  );
}
```

---

## 注意事项

1. **缓存键生成**：缓存键基于请求参数生成，确保参数稳定以避免不必要的缓存失效。
2. **请求取消**：组件卸载时会自动取消请求，避免内存泄漏。
3. **错误处理**：建议在 `onError` 回调中处理错误，避免未捕获的异常。

---

希望这份文档能帮助你和其他开发者更好地理解和使用这些 Hook！如果有任何问题或建议，欢迎反馈。
