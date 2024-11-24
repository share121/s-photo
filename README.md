# sPhoto

sPhoto 是 share121 用 Tauri + TS + Rust 开发的一款开源照片筛选软件

欢迎👏关注我的 B 站账号[_share121](https://b23.tv/UzIsd79)

```mermaid
sequenceDiagram
    participant User as 用户
    participant App as 应用程序
    participant FS as 文件系统
    participant DB as 数据库
    participant BW as 后台工作者

    User->>App: 打开文件夹
    App->>FS: 请求文件夹内容
    FS-->>App: 返回文件夹内容
    App->>User: 显示文件夹内容
    User->>App: 选择文件
    App->>FS: 请求文件内容
    FS-->>App: 返回文件内容
    App->>BW: 生成标签
    BW->>App: 返回标签
    App->>DB: 存储标签
    DB-->>App: 确认存储
    App->>User: 显示标签
    User->>App: 修改标签
    App->>DB: 更新标签
    DB-->>App: 确认更新
    App->>User: 显示更新后的标签
```
