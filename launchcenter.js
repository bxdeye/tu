// 文件管理器
const fm = FileManager.local();
const settingsFile = fm.joinPath(fm.documentsDirectory(), "shortcut_settings.json");
const backgroundFile = fm.joinPath(fm.documentsDirectory(), "widget_background.jpg");

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

  // 添加背景设置行
  let backgroundRow = new UITableRow();
  backgroundRow.height = 50;
  let backgroundButton = backgroundRow.addButton("设置背景图片");
  backgroundButton.centerAligned();
  backgroundButton.onTap = async () => {
    const img = await Photos.fromLibrary();
    fm.writeImage(backgroundFile, img);
    await showSettings();
  };
  table.addRow(backgroundRow);

  // 显示现有链接
  for (let i = 0; i < actions.length; i++) {
    let action = actions[i];
    let row = new UITableRow();
    row.height = 60;

    // 添加图标
    let iconCell = row.addImage(await loadImage(action.iconUrl || ""));
    iconCell.widthWeight = 15;

    // 显示链接 URL
    let urlCell = row.addText(action.url || "未设置链接");
    urlCell.widthWeight = 50;

    // 添加编辑按钮
    let editButton = row.addButton("编辑");
    editButton.widthWeight = 15;
    editButton.onTap = async () => {
      await editLink(i);
    };

    // 添加删除按钮
    let deleteButton = row.addButton("删除");
    deleteButton.widthWeight = 20;
    deleteButton.onTap = () => {
      actions.splice(i, 1);
      saveSettings(actions);
      showSettings();
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
    await editLink(actions.length - 1);
  };
  table.addRow(addRow);

  // 添加“预览”按钮
  let previewRow = new UITableRow();
  previewRow.height = 50;
  let previewButton = previewRow.addButton("预览效果");
  previewButton.centerAligned();
  previewButton.onTap = async () => {
    let widget = await generateWidget();
    widget.presentMedium();
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
  alert.addAction("从相册选择图标");
  alert.addAction("保存");
  alert.addCancelAction("取消");

  let response = await alert.present();
  if (response === 0) {
    // 从相册选择图标
    const img = await Photos.fromLibrary();
    const path = fm.joinPath(fm.documentsDirectory(), `icon_${Date.now()}.png`);
    fm.writeImage(path, img);
    action.iconUrl = `file://${path}`;
    saveSettings(actions);
  } else if (response === 1) {
    // 保存输入的链接和图标 URL
    action.url = alert.textFieldValue(0);
    action.iconUrl = alert.textFieldValue(1);
    saveSettings(actions);
  }

  await showSettings();
}

// 生成小组件
async function generateWidget() {
  let widget = new ListWidget();

  // 设置背景
  if (fm.fileExists(backgroundFile)) {
    widget.backgroundImage = fm.readImage(backgroundFile);
  } else {
    widget.backgroundColor = new Color("#f2f2f7");
  }

  const iconSize = 30; // 图标大小
  const spacing = 5; // 图标间隔
  const itemsPerRow = 8; // 每行显示的图标数量
  const totalRows = Math.ceil(actions.length / itemsPerRow); // 计算行数

  const totalHeight = totalRows * iconSize + (totalRows - 1) * spacing; // 计算图标总高度
  const widgetHeight = 168; // 小组件标准高度
  const extraShift = -3; // 向上微调的额外像素

  // 调整上下间距
  const topPadding = Math.max(0, (widgetHeight - totalHeight) / 2 - extraShift);
  const bottomPadding = Math.max(0, (widgetHeight - totalHeight) / 2 + extraShift);

  widget.setPadding(topPadding, 10, bottomPadding, 10); // 设置上、右、下、左留白

  for (let row = 0; row < totalRows; row++) {
    let rowStack = widget.addStack();
    rowStack.spacing = spacing; // 设置图标之间的间距
    rowStack.centerAlignContent();

    for (let col = 0; col < itemsPerRow; col++) {
      let index = row * itemsPerRow + col;
      if (index >= actions.length) break;

      let action = actions[index];
      let buttonStack = rowStack.addStack();
      buttonStack.layoutVertically();
      buttonStack.setPadding(3, 3, 3, 3); // 图标边距
      buttonStack.url = action.url || "#";

      try {
        let req = new Request(action.iconUrl);
        let iconImage = await req.loadImage();
        let icon = buttonStack.addImage(iconImage);
        icon.imageSize = new Size(iconSize, iconSize);
        icon.cornerRadius = 6; // 圆角处理
      } catch (e) {
        let placeholder = buttonStack.addText("🚫");
        placeholder.font = Font.boldSystemFont(14);
        placeholder.textColor = new Color("#ff3333");
        placeholder.centerAlignText();
      }
    }
    widget.addSpacer(spacing); // 添加行间距
  }

  return widget;
}

// 加载图标
async function loadImage(url) {
  try {
    if (url.startsWith("file://")) {
      return Image.fromFile(url.replace("file://", ""));
    } else {
      let req = new Request(url);
      return await req.loadImage();
    }
  } catch (e) {
    return Image.fromFile(fm.joinPath(fm.documentsDirectory(), "placeholder.png"));
  }
}

// 判断运行环境
if (config.runsInWidget) {
  let widget = await generateWidget();
  Script.setWidget(widget);
} else {
  await showSettings();
}
Script.complete();
