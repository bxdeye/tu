// 文件管理器
const fm = FileManager.local();
const settingsFile = fm.joinPath(fm.documentsDirectory(), "shortcut_settings.json");

// 读取配置文件
let actions = [];
if (fm.fileExists(settingsFile)) {
  try {
    actions = JSON.parse(fm.readString(settingsFile));
    actions = actions.filter((item) => item && typeof item.url === "string" && typeof item.iconUrl === "string");
  } catch (e) {
    actions = [];
  }
} else {
  actions = [];
  saveSettings(actions);
}

// 保存配置
function saveSettings(data) {
  fm.writeString(settingsFile, JSON.stringify(data, null, 2));
}

// 显示设置界面
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

// 编辑链接
async function editLink(index) {
  let action = actions[index] || { url: "", iconUrl: "" };

  let alert = new Alert();
  alert.title = `编辑链接 ${index + 1}`;
  alert.addTextField("链接 URL", action.url || "");
  alert.addTextField("图标 URL", action.iconUrl || "");
  alert.addAction("保存");
  alert.addCancelAction("取消");

  let response = await alert.present();
  if (response === 0) {
    action.url = alert.textFieldValue(0);
    action.iconUrl = alert.textFieldValue(1);
    actions[index] = action; // 保存到数组
    saveSettings(actions); // 保存到文件
  }

  await showSettings(); // 返回设置界面
}

// 预览小组件
async function previewSettings() {
  let widget = new ListWidget();
  widget.backgroundColor = new Color("#f2f2f7");

  let title = widget.addText("快捷启动中心");
  title.font = Font.boldSystemFont(16);
  title.textColor = new Color("#333333");
  title.centerAlignText();
  widget.addSpacer(10);

  const iconSize = 30;
  const itemsPerRow = 8;
  const totalRows = Math.ceil(actions.length / itemsPerRow);

  for (let row = 0; row < totalRows; row++) {
    let rowStack = widget.addStack();
    rowStack.spacing = 10;
    rowStack.centerAlignContent();

    for (let col = 0; col < itemsPerRow; col++) {
      let index = row * itemsPerRow + col;
      if (index >= actions.length) break;

      let action = actions[index];
      let buttonStack = rowStack.addStack();
      buttonStack.layoutVertically();
      buttonStack.setPadding(5, 5, 5, 5);
      buttonStack.url = action.url || "#";

      try {
        let req = new Request(action.iconUrl);
        let iconImage = await req.loadImage();
        let icon = buttonStack.addImage(iconImage);
        icon.imageSize = new Size(iconSize, iconSize);
        icon.cornerRadius = 6;
      } catch (e) {
        let placeholder = buttonStack.addText("🚫");
        placeholder.font = Font.boldSystemFont(14);
        placeholder.textColor = new Color("#ff3333");
        placeholder.centerAlignText();
      }
    }
    widget.addSpacer(10);
  }

  if (config.runsInWidget) {
    return widget;
  } else {
    widget.presentMedium();
  }
}

// 加载图标
async function loadImage(url) {
  try {
    let req = new Request(url);
    return await req.loadImage();
  } catch (e) {
    return Image.fromFile(fm.joinPath(fm.documentsDirectory(), "placeholder.png"));
  }
}

// 直接进入设置界面
await showSettings();
Script.complete();
