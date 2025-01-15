async function showSettings() {
  let table = new UITable();
  table.showSeparators = true;

  // 显示现有链接
  for (let i = 0; i < actions.length; i++) {
    let action = actions[i];
    let row = new UITableRow();
    row.height = 60; // 增加行高度，确保按钮区域更大

    // 添加图标
    let iconCell = row.addImage(await loadImage(action.iconUrl || ""));
    iconCell.widthWeight = 15; // 缩小图标所占比例

    // 显示链接 URL
    let urlCell = row.addText(action.url || "未设置链接");
    urlCell.widthWeight = 50;

    // 添加编辑按钮
    let editButton = row.addButton("编辑");
    editButton.widthWeight = 15; // 增加按钮的比例
    editButton.onTap = async () => {
      await editLink(i);
    };

    // 添加删除按钮
    let deleteButton = row.addButton("删除");
    deleteButton.widthWeight = 20; // 保持删除按钮稍大
    deleteButton.onTap = () => {
      actions.splice(i, 1); // 删除当前链接
      saveSettings(actions);
      showSettings(); // 刷新界面
    };

    table.addRow(row);
  }

  // 添加“加号”按钮
  let addRow = new UITableRow();
  addRow.height = 50;
  let addButton = addRow.addButton("添加新链接");
  addButton.centerAligned();
  addButton.onTap = async () => {
    actions.push({ url: "", iconUrl: "" });
    saveSettings(actions);
    await editLink(actions.length - 1); // 进入新链接编辑界面
  };
  table.addRow(addRow);

  // 添加“预览”按钮
  let previewRow = new UITableRow();
  previewRow.height = 50;
  let previewButton = previewRow.addButton("预览效果");
  previewButton.centerAligned();
  previewButton.onTap = async () => {
    await previewSettings();
  };
  table.addRow(previewRow);

  await table.present();
}
