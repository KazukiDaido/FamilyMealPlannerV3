# デバッグガイド

## ログの確認方法

### 1. Metro Bundlerのログを確認する

アプリを実行すると、ターミナルに Metro Bundler のログが表示されます。

#### 方法:
1. ターミナルで以下のコマンドを実行している画面を確認
   ```bash
   npx expo start
   ```
   または
   ```bash
   npx expo run:ios
   ```

2. ターミナルに以下のようなログが表示されます:
   ```
   LOG  スケジュール画面: useEffect開始 {"currentMemberId": "member_xxx", ...}
   LOG  権限チェック: {"currentMemberId": "member_xxx", "memberId": "member_yyy", ...}
   ```

### 2. Chrome DevTools を使用する（推奨）

より詳細なログを確認するには Chrome DevTools を使用します。

#### 手順:
1. Metro Bundler が起動している状態で、ブラウザで以下のURLを開く:
   ```
   http://localhost:8081/debugger-ui
   ```

2. Chrome DevTools が開いたら、"Console" タブを開く

3. アプリで操作を行うと、コンソールにログが表示されます

### 3. React Native Debugger を使用する（オプション）

より高度なデバッグには React Native Debugger を使用できます。

#### インストール:
```bash
brew install --cask react-native-debugger
```

#### 使用方法:
1. React Native Debugger を起動
2. Metro Bundler でアプリを起動
3. アプリ内で「開発メニュー」を開く（シミュレータで `Cmd + D`）
4. "Debug" を選択

## 現在のデバッグログ

### スケジュール画面

- **useEffect開始**: 画面が読み込まれた時のログ
  ```
  currentMemberId: 現在ログインしているメンバーのID
  currentFamilyId: 現在の家族ID
  membersCount: メンバー数
  ```

- **権限チェック**: トグルを操作しようとした時のログ
  ```
  currentMemberId: 現在のメンバーID
  memberId: 操作対象のメンバーID
  members: メンバー数
  ```

- **現在のメンバー**: 権限チェック時の詳細
  ```
  name: メンバー名
  isProxy: 代理登録権限の有無
  ```

## トラブルシューティング

### 「現在のメンバーID: 未設定」と表示される場合

**原因**: ログイン時に `currentMemberId` が設定されていません。

**解決方法**:
1. アプリを完全に終了
2. AsyncStorage をクリア（設定画面から）
3. アプリを再起動してログインし直す

### トグルをタップしても反応しない場合

**確認ポイント**:
1. ターミナルまたは Chrome DevTools で以下のログを確認:
   - `権限チェック:` のログが表示されるか
   - `currentMemberId` の値が正しいか
   - `警告: currentMemberId が設定されていません` が表示されていないか

2. スケジュール画面上部の「現在のメンバーID」を確認
   - 「未設定」と表示されている場合、ログインに問題があります
   - IDが表示されている場合、権限の問題です

### ログが何も表示されない場合

1. Metro Bundler が起動しているか確認
2. `console.log` が無効化されていないか確認
3. Chrome DevTools を開いて Console タブを確認

## よくある問題

### 問題1: currentMemberId が undefined

**症状**: トグルが全て無効化されている

**原因**: ログイン時に currentMemberId が設定されていない

**解決**: `App.tsx` の `FamilyMemberLoginScreen` でログイン時に `setCurrentMember` が呼ばれているか確認

### 問題2: 代理登録権限がないのにトグルが操作できる

**症状**: 権限チェックが機能していない

**原因**: `canToggleMemberAttendance` 関数が正しく呼ばれていない

**解決**: `ScheduleScreen.tsx` の `disabled` 属性を確認

### 問題3: Firebase のリアルタイム同期が動作しない

**症状**: トグルを操作しても他のデバイスに反映されない

**原因**: Firebase の設定またはネットワークの問題

**解決**: 
1. Firebase Console でデータが保存されているか確認
2. ネットワーク接続を確認
3. 画面上部の同期ステータスを確認（「リアルタイム同期中」または「オフライン」）

