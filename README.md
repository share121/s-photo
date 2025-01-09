# s-photo

## 介绍

s-photo 是 share121 用 Tauri + TS + Rust
开发的一款开源照片筛选软件，它可以让你使用几个按键来快速筛选照片

## 优势

原先筛选照片需要，查看照片，然后把不需要的照片移动“弃用”文件夹，需要的照片移动到“选用”文件夹，这个过程存在大量的
**重复性劳动**。然而有了我的软件后，我可以使用 `Q` 键选用、`P` 键弃用、`Z`
键撤销、`↑` `↓` `←` `→` 键在文件中移动。

当你按下 `Q` 键时，会自动把照片移动到“选用”文件夹 当你按下 `P`
键时，会自动把照片移动到“弃用”文件夹

省去了打开照片、移动文件的繁杂过程

## 开发原因

学校三节期间，我作为信息部成员，需要筛选拍摄组拍摄的上万张照片，然而，原始的筛选方法太低效了。于是我开发了这款软件，使信息部的工作效率大大提高。

欢迎 👏 关注我的 B 站账号[\_share121](https://b23.tv/UzIsd79)

```mermaid
flowchart LR
    subgraph 用户界面
        UI[用户界面]
        UI -->|打开文件夹| FileDialog[文件对话框]
        UI -->|选择文件| FileSelect[选择文件]
        UI -->|丢弃文件| FileDiscard[丢弃文件]
        UI -->|取消| FileCancel[取消]
        UI -->|下一步| FileNext[下一步]
    end

    subgraph 文件管理
        FileDialog -->|选择文件夹| FileList[文件列表]
        FileSelect -->|选择文件| FileList
        FileDiscard -->|丢弃文件| FileList
        FileCancel -->|取消| FileList
        FileNext -->|下一步| FileList
        FileList -->|打开文件| FileReader[文件读取器]
    end

    subgraph 标签处理
        FileReader -->|读取文件| TagWorker[标签处理器]
        TagWorker -->|处理标签| TagStore[标签存储]
        TagStore -->|保存标签| UI
    end

    subgraph 数据存储
        TagStore -->|保存标签| FileStorage[文件存储]
        FileStorage -->|加载标签| TagStore
    end

    subgraph GitHub Actions
        GitHubActions[GitHub Actions]
        GitHubActions -->|发布版本| Release[发布]
        Release -->|更新仓库| Repo[仓库]
    end

    GitHubActions -->|触发工作流| 用户界面
    用户界面 -->|触发工作流| GitHubActions
```
