# Firebase設定手順

## 1. Firebaseコンソールでプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名: `family-meal-planner-v3`（または任意の名前）
4. Google Analyticsは任意で有効化
5. 「プロジェクトを作成」をクリック

## 2. Authentication設定

1. 左メニューから「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブを選択
4. 「匿名」を有効化
5. 「保存」をクリック

## 3. Firestore設定

1. 左メニューから「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. セキュリティルール: 「テストモードで開始」（後で本番用に変更）
4. ロケーション: `asia-northeast1`（東京）を選択
5. 「完了」をクリック

## 4. Webアプリの追加

1. プロジェクトの概要画面で「Web」アイコン（</>）をクリック
2. アプリのニックネーム: `family-meal-planner-web`
3. 「Firebase Hosting」はチェックしない
4. 「アプリを登録」をクリック
5. 設定コードをコピー

## 5. 設定ファイルの更新

1. `src/config/firebase.ts`の`firebaseConfig`を実際の値に更新
2. コピーした設定コードから値を取得

```typescript
const firebaseConfig = {
  apiKey: "実際のAPIキー",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "実際のSenderID",
  appId: "実際のAppID"
};
```

## 6. Firestoreセキュリティルール（本番用）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 家族メンバー: 認証されたユーザーのみ読み書き可能
    match /familyMembers/{document} {
      allow read, write: if request.auth != null;
    }
    
    // 食事参加データ: 認証されたユーザーのみ読み書き可能
    match /mealAttendances/{document} {
      allow read, write: if request.auth != null;
    }
    
    // 個人回答: 認証されたユーザーのみ読み書き可能
    match /personalResponses/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 7. テストデータの投入

アプリを起動して家族メンバーを追加すると、Firestoreにデータが自動で保存されます。

## 8. トラブルシューティング

- Firebase設定が正しくない場合、ダミーデータが使用されます
- コンソールでエラーメッセージを確認してください
- ネットワーク接続を確認してください


