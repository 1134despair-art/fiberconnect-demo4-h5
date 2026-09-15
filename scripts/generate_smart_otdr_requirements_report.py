from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(r"c:\Users\EDY\Desktop\工作文件\嗨创\入职培训资料\demo\demo4\APP")
OUTPUT_DIR = ROOT / "智能otdr需求汇总"
DOCX_PATH = OUTPUT_DIR / "智能OTDR需求比对与复用分析报告.docx"
MD_PATH = OUTPUT_DIR / "智能OTDR需求比对与复用分析报告.md"


REQUIREMENT_GROUPS = [
    (
        "OTDR测量与分析能力",
        [
            "具备 OTDR 测量能力，支持 1310nm、1550nm 双波长检测。",
            "测量范围支持可配置多量程，原始交接书要求覆盖 100m 至 200km。",
            "脉宽支持可配置，原始交接书要求覆盖 5ns 至 10us，以适配不同量程。",
            "支持实时模式与平均模式，平均时长可配置，并支持测量时间选择。",
            "支持折射率编辑、引导光纤设置、接收光纤设置及距离单位切换。",
            "支持衰减门限、反射门限、末端门限、散射系数及合格判定门限设置。",
            "支持曲线缩放、自定义光标，并具备事件识别与事件分析能力。",
            "支持测试结果保存、SOR 导出、历史文件加载与文件名格式编辑。",
            "要求具备更高距离分辨率和 APD 高压自动补偿等硬件性能能力。",
        ],
    ),
    (
        "光学测量与发光能力",
        [
            "内置光功率计，支持多量程检测、常见波长切换、参考值设置、参考清零、手动校准和频率检测。",
            "原始交接书要求光功率计支持 dBm、mW、uW 等显示单位，以及 +10 至 -70dBm 检测范围。",
            "内置红光源 VFL，支持常亮、1Hz、2Hz、CW 输出，并要求兼容绿光输出。",
            "内置光源输出能力，结合 OTDR 组件支持 1310/1550 双波长及 270Hz、330Hz、1kHz、2kHz、CW 频率切换。",
            "支持损耗测试，基于发射光源与光功率计进行回环损耗测试，并支持参考设置与参考清零。",
        ],
    ),
    (
        "辅测能力与扩展能力",
        [
            "支持网线测试，包含线序识别、线长检测、寻线以及固定频率信号发射。",
            "支持事件地图能力，要求自动诊断、OTDR 参数设置、合格判定门限设置、分路器参数设置，以及结果保存与历史加载。",
            "支持文件管理，可进行加载、删除、移动、重命名等常规文件操作，并支持内部存储、SD 卡、U 盘等介质。",
        ],
    ),
    (
        "系统、无线与设备管理",
        [
            "支持日期时间设置、自动关机、背光调节、蜂鸣开关、多语言、远程升级、电量显示、手电筒和截屏功能。",
            "支持蓝牙及 4G 联网，结合外部 APP 可实现数据获取、参数设置、蓝牙升级及远程文件查看。",
            "支持设备激活码、蓝牙激活、授权时间可编辑、到期锁机等设备管理能力。",
            "UI 侧要求支持新的界面设计、菜单图标替换、开机画面编辑，并支持通过 SD 卡加密导入。",
        ],
    ),
]


CURRENT_SMART_OTDR = [
    ("智能 OTDR 主详情", "已实现", "基于 `smart-otdr` 路由提供概览、参数设置、门限设置、测试结果四个页内视图，支持开始测试、取消测试、最近记录、结果摘要与事件分析入口。"),
    ("参数设置", "已实现", "支持波长、量程、脉宽、测量时间、自定义秒数、折射率、引导光纤、接收光纤、单位和有光校准，并区分草稿值与已保存值。"),
    ("门限设置", "已实现", "支持衰减、反射、末端、散射系数与合格判定门限，支持默认值重置与保存状态提示。"),
    ("曲线展示", "部分实现", "支持空闲、测试中、测试完成三态曲线与事件点高亮，但尚未提供真正的缩放、拖动和自定义双光标能力。"),
    ("测试结果页", "已实现", "支持总损耗、平均损耗、事件数、最大反射、测试结论、事件列表、保存、重新测试、SOR 导出和文件管理跳转。"),
    ("事件地图", "已实现", "提供独立 `event-map` 页面，支持参数摘要、结果汇总条、轨迹图、完整事件表、测试、保存、设置和返回 OTDR。"),
    ("事件分析入口", "已实现", "OTDR 概览页原事件预览区已替换为事件分析入口卡，可直接跳转到事件地图页面。"),
    ("智能光功率计", "已实现", "提供 `smart-opm` 页面，支持开启/关闭、波长切换、设为参考、参考置零、校准及退出。"),
    ("光源", "已实现", "提供独立 `light-source` 页面，支持开启/关闭、双波长切换、频率切换和退出。"),
    ("红光源 VFL", "已实现", "复用 `vfl` 页面，当前项目支持 Off/On/1Hz/2Hz/CW，并兼容红光/绿光切换。"),
    ("网线测试", "已实现", "已合并为统一 `cable-test` 入口，支持线序、线长、寻线三种模式。"),
    ("损耗测试", "部分实现", "已重做为独立详情页，支持开启/关闭、1310/1550 波长切换、设为参考、参考置零和退出，但未形成真实回环损耗计算流程。"),
    ("文件管理", "部分实现", "已提供内部存储/SD 卡/U 盘切换、SOR 导出、加载、重命名、移动、删除等 UI，但当前主要为 Mock 展示，尚未完成真实文件流转。"),
    ("系统设置", "部分实现", "系统设置页已覆盖蓝牙、语言、日期时间、自动关机、背光校正、4G 状态、电池、手电筒、截图提示、固件升级、激活等模块，但多数硬件交互仍为静态状态。"),
    ("设备激活", "已实现", "智能 OTDR 详情页已具备独立激活卡、到期状态、蓝牙依赖校验、激活成功反馈及授权时间展示。"),
]


COMPARISON_ROWS = [
    ("OTDR 主流程", "主详情页、测试流程、结果页", "已实现", "支持概览/参数/门限/结果四视图，具备空闲-测试中-完成三态与最近记录。"),
    ("参数配置", "波长、量程、脉宽、测量时间、折射率、引导/接收光纤、单位、有光校准", "已实现", "页面完整，具备保存机制与草稿/已保存状态区分。"),
    ("门限配置", "衰减、反射、末端、散射系数、合格判断门限", "已实现", "门限项齐全，具备保存与恢复默认值。"),
    ("曲线交互", "曲线缩放、自定义光标", "部分实现", "目前已有曲线和事件点高亮，但未实现硬件级缩放与光标交互。"),
    ("事件分析", "事件识别、事件地图、诊断分析", "已实现", "已具备事件列表、事件地图页、汇总指标与完整事件表。"),
    ("文件操作", "SOR 导出、加载、重命名、删除、移动、多介质管理", "部分实现", "文件管理页面和按钮已具备，主要为 Mock 数据流，未形成完整真实文件生命周期。"),
    ("光功率计", "波长切换、参考值、清零、校准、频率检测、单位切换", "部分实现", "核心操作已完成，频率检测和多单位切换未完全落地。"),
    ("红光源 VFL", "常亮、1Hz、2Hz、CW、兼容绿光", "已实现", "项目已有完整 VFL 工具页，支持红/绿光切换。"),
    ("光源输出", "双波长光源、270Hz/330Hz/1kHz/2kHz/CW", "已实现", "独立光源页面已完整覆盖。"),
    ("网线测试", "线序、线长、寻线、固定频率信号", "已实现", "三项能力已统一收口到一个入口。"),
    ("事件地图", "自动诊断、参数、门限、分路器、保存、历史加载", "部分实现", "页面能力齐全，保存已支持；历史加载仍更多依赖文件管理与 Mock 流程。"),
    ("损耗测试", "回环损耗、双波长、参考值、清零", "部分实现", "当前实现更接近损耗测试面板 UI，尚未形成真实损耗计算闭环。"),
    ("系统功能", "时间、自动关机、背光、蜂鸣、多语言、升级、电量、手电筒、截屏", "部分实现", "已覆盖大部分系统菜单；蜂鸣器等个别项在代码中未明确体现。"),
    ("无线与远程", "蓝牙、蓝牙升级、4G 联网、远程查看和设置", "部分实现", "蓝牙/4G/远程升级状态页已具备，但真实远程数据链路未接入。"),
    ("设备管理", "激活码、蓝牙激活、授权时间、到期锁机", "已实现", "设备详情与系统设置均已覆盖激活和授权时间管理。"),
    ("硬件性能指标", "0.25m 分辨率、APD 高压补偿等", "未体现", "当前项目以前端静态页面和 Mock 数据为主，尚未承载底层硬件性能能力。"),
]


REUSE_ROWS = [
    (
        "设备详情页基础骨架",
        "智能 OTDR 详情页、状态卡、基础信息卡、操作入口网格",
        "便携 OTDR、MOPM、多合一设备、熔接机",
        "可抽为统一 `DeviceDetailShell` + `OperationGrid`，减少各设备详情页重复布局代码。",
    ),
    (
        "OTDR 曲线与测量状态机",
        "SmartOtdrCurveCard、SmartOtdrMeasure 中的测量进度和结果流转",
        "便携 OTDR `OtdrOperation.vue`",
        "两者都包含波形绘制、测量中倒计时、结果完成后查看；建议抽成统一 TraceRenderer 与 MeasureSession 状态模型。",
    ),
    (
        "光功率计测量内核",
        "SmartPowerMeter、SmartLossTest 中的波长切换、参考值、相对功率",
        "OpmOperation、OpmOperationMultiOpm",
        "可以沉淀成统一 `useOpticalPowerMeter()` 组合式逻辑，统一读数、参考值、单位、校准和历史记录模型。",
    ),
    (
        "发光控制能力",
        "LightSourceOperation、VflOperation",
        "多合一设备、便携设备、熔接机中的 VFL/光源页",
        "建议抽成 `useEmitterControl()`，统一开启/关闭、波长、频率、颜色状态与按钮策略。",
    ),
    (
        "文件与历史记录中心",
        "SmartFileManager、SmartOtdrRecentRecords、事件地图结果保存",
        "FusionRecords、MOPM 历史页",
        "建议统一文件记录 DTO，后续各设备共用文件加载、重命名、导出、删除、移动等能力。"),
    (
        "系统设置平台能力",
        "SystemSettings 中的蓝牙、语言、时间、自动关机、升级、4G、电池、激活",
        "四类设备共用",
        "建议按能力开关显示不同项，而不是每个设备复制一套设置页。"),
    (
        "激活与授权模型",
        "SmartOtdrActivationCard、DeviceDetail 与 SystemSettings 中的激活流程",
        "既有设备的激活弹窗与授权时间配置",
        "建议统一成 `ActivationStatus + AuthorizationPolicy + ActivationActions` 模块，避免多个入口重复维护。"),
    (
        "卡片式详情页 UI 规范",
        "Smart OPM、损耗测试、光源、事件地图等页面",
        "熔接机详情页及其工具页",
        "当前智能 OTDR 已大量向熔接机风格靠拢，建议沉淀统一设计 token 和卡片组件。"),
]


DEVICE_COMPARISON_ROWS = [
    (
        "便携 OTDR",
        "已有 OTDR 波形绘制、测量流程、量程/脉宽/模式控制和系统设置入口。",
        "曲线渲染、测量状态机、量程脉宽控制逻辑、系统设置能力可直接共用或抽象。",
        "便携 OTDR 更偏单功能测量工具，智能 OTDR 已扩展为平台式聚合设备。"),
    (
        "多合一光功率计",
        "已有 OPM 主流程、历史记录、VFL/光源相关能力和系统设置。",
        "光功率计读数逻辑、波长切换、历史记录结构、VFL/光源按钮流可共用。",
        "智能 OTDR 的 Smart OPM、Loss Test、Light Source 与其高度重叠，但 UI 和入口组织更复杂。"),
    (
        "熔接机",
        "已有完整详情页框架、工具页卡片布局、熔接记录和系统设置。",
        "详情页风格、头部结构、卡片化工具页、记录列表、系统设置与文件流转模式可复用。",
        "智能 OTDR 当前大量页面已经主动向熔接机详情页视觉和交互风格靠拢，是最适合承接公共 UI 基线的设备。"),
    (
        "智能 OTDR",
        "当前已聚合 OTDR、事件地图、Smart OPM、损耗测试、文件管理、光源、VFL、网线测试、系统设置。",
        "适合作为“综合测量平台”能力容器，把前三类设备已有能力抽象成可复用模块后再二次组合。",
        "后续重点不应再继续复制页面，而应沉淀公共状态模型、卡片组件和设备能力开关。"),
]


RECOMMENDATIONS = [
    "P0：抽取统一的设备详情页壳层、页面头部、状态卡、操作入口网格，作为四类设备的公共容器。",
    "P0：抽取统一的光功率测量组合逻辑，覆盖 Smart OPM、Loss Test、既有 OPM 页面。",
    "P1：抽取统一的 OTDR 测量会话模型，沉淀测量状态、曲线数据、事件列表、保存导出行为。",
    "P1：统一文件与历史记录模型，让 OTDR、事件地图、损耗测试、MOPM 历史、熔接记录进入同一文件中心。",
    "P1：按能力开关重构 SystemSettings，让蓝牙、4G、升级、激活、电池、时间、语言等成为公共模块。",
    "P2：沉淀设计规范，统一卡片圆角、按钮层级、信息卡、状态徽标和表单保存条，减少后续 UI 风格漂移。",
]


SOURCE_FILES = [
    "智能otdr需求汇总/智能OTDR项目交接书.docx",
    "src/pages/home/Home.vue",
    "src/pages/device/DeviceDetail.vue",
    "src/router/index.ts",
    "src/pages/device/operations/SmartOtdrMeasure.vue",
    "src/pages/device/components/SmartOtdrParameterPanel.vue",
    "src/pages/device/components/SmartOtdrThresholdPanel.vue",
    "src/pages/device/components/SmartOtdrResultPanel.vue",
    "src/pages/device/components/SmartOtdrOverviewPanel.vue",
    "src/pages/device/operations/EventMapOperation.vue",
    "src/pages/device/operations/SmartPowerMeter.vue",
    "src/pages/device/operations/LightSourceOperation.vue",
    "src/pages/device/operations/CableTestOperation.vue",
    "src/pages/device/operations/SmartLossTest.vue",
    "src/pages/device/operations/SmartEndfaceInspect.vue",
    "src/pages/device/operations/SmartFileManager.vue",
    "src/pages/device/operations/SystemSettings.vue",
    "src/pages/device/operations/VflOperation.vue",
    "src/pages/device/operations/OtdrOperation.vue",
    "src/pages/device/operations/OpmOperationMultiOpm.vue",
]


def set_cell_text(cell, text, bold=False):
    cell.text = ""
    paragraph = cell.paragraphs[0]
    run = paragraph.add_run(str(text))
    run.bold = bold
    run.font.name = "Microsoft YaHei"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    run.font.size = Pt(10.5)
    paragraph.paragraph_format.space_after = Pt(0)


def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_paragraph_style(paragraph, size=11, bold=False, color=None):
    for run in paragraph.runs:
        run.font.name = "Microsoft YaHei"
        run._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
        run.font.size = Pt(size)
        run.bold = bold
        if color:
            run.font.color.rgb = RGBColor.from_string(color)


def add_bullets(document, items):
    for item in items:
        p = document.add_paragraph(style="List Bullet")
        p.add_run(item)
        set_paragraph_style(p, size=10.5)


def add_table(document, headers, rows):
    table = document.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    hdr_cells = table.rows[0].cells
    for index, header in enumerate(headers):
        set_cell_text(hdr_cells[index], header, bold=True)
        shade_cell(hdr_cells[index], "DCEBFF")
    for row in rows:
        cells = table.add_row().cells
        for index, value in enumerate(row):
            set_cell_text(cells[index], value)
    return table


def add_markdown_line(lines, text=""):
    lines.append(text)


def build_markdown():
    lines = []
    add_markdown_line(lines, "# 智能OTDR需求比对与复用分析报告")
    add_markdown_line(lines)
    add_markdown_line(lines, "- 比对对象：`智能OTDR项目交接书.docx` 与当前项目智能 OTDR 代码实现")
    add_markdown_line(lines, "- 比对时间：2026-06-25")
    add_markdown_line(lines, "- 设备范围说明：本报告中的“前三类设备”依据项目设备类型定义，指 `便携OTDR`、`多合一光功率计`、`熔接机`。")
    add_markdown_line(lines)
    add_markdown_line(lines, "## 初始需求完整描述")
    for title, items in REQUIREMENT_GROUPS:
        add_markdown_line(lines, f"### {title}")
        for item in items:
            add_markdown_line(lines, f"- {item}")
        add_markdown_line(lines)
    add_markdown_line(lines, "## 当前智能OTDR功能清单")
    for name, status, detail in CURRENT_SMART_OTDR:
        add_markdown_line(lines, f"- {name}：{status}。{detail}")
    add_markdown_line(lines)
    add_markdown_line(lines, "## 需求比对矩阵")
    add_markdown_line(lines, "| 模块 | 原始需求摘要 | 当前状态 | 说明 |")
    add_markdown_line(lines, "| --- | --- | --- | --- |")
    for row in COMPARISON_ROWS:
        add_markdown_line(lines, f"| {row[0]} | {row[1]} | {row[2]} | {row[3]} |")
    add_markdown_line(lines)
    add_markdown_line(lines, "## 与前三类设备的共用能力梳理")
    add_markdown_line(lines, "| 设备 | 现有能力概况 | 与智能OTDR可共用点 | 差异说明 |")
    add_markdown_line(lines, "| --- | --- | --- | --- |")
    for row in DEVICE_COMPARISON_ROWS:
        add_markdown_line(lines, f"| {row[0]} | {row[1]} | {row[2]} | {row[3]} |")
    add_markdown_line(lines)
    add_markdown_line(lines, "## 建议沉淀的公共能力")
    add_markdown_line(lines, "| 可复用域 | 智能OTDR当前对应功能 | 复用来源 | 建议 |")
    add_markdown_line(lines, "| --- | --- | --- | --- |")
    for row in REUSE_ROWS:
        add_markdown_line(lines, f"| {row[0]} | {row[1]} | {row[2]} | {row[3]} |")
    add_markdown_line(lines)
    add_markdown_line(lines, "## 复用与重构优先级建议")
    for item in RECOMMENDATIONS:
        add_markdown_line(lines, f"- {item}")
    add_markdown_line(lines)
    add_markdown_line(lines, "## 代码依据")
    for item in SOURCE_FILES:
        add_markdown_line(lines, f"- `{item}`")
    add_markdown_line(lines)
    return "\n".join(lines)


def build_docx():
    document = Document()
    section = document.sections[0]
    section.start_type = WD_SECTION_START.NEW_PAGE
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

    normal_style = document.styles["Normal"]
    normal_style.font.name = "Microsoft YaHei"
    normal_style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    normal_style.font.size = Pt(10.5)

    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title.add_run("智能OTDR需求比对与复用分析报告")
    title_run.bold = True
    title_run.font.name = "Microsoft YaHei"
    title_run._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    title_run.font.size = Pt(18)

    subtitle = document.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.add_run("基于原始交接书与当前前端项目实现的交付分析文档")
    set_paragraph_style(subtitle, size=10.5, color="4B5563")

    overview = document.add_paragraph()
    overview.add_run("比对对象：").bold = True
    overview.add_run("`智能OTDR项目交接书.docx` 与当前项目智能 OTDR 代码实现")
    set_paragraph_style(overview, size=10.5)

    note = document.add_paragraph()
    note.add_run("设备范围说明：").bold = True
    note.add_run("本报告中的“前三类设备”依据项目设备类型定义，指便携 OTDR、多合一光功率计、熔接机。")
    set_paragraph_style(note, size=10.5)

    document.add_heading("1. 初始需求完整描述", level=1)
    for title_text, items in REQUIREMENT_GROUPS:
        document.add_heading(title_text, level=2)
        add_bullets(document, items)

    document.add_heading("2. 当前智能OTDR功能清单", level=1)
    for name, status, detail in CURRENT_SMART_OTDR:
        paragraph = document.add_paragraph(style="List Bullet")
        paragraph.add_run(f"{name}：").bold = True
        paragraph.add_run(f"{status}。{detail}")
        set_paragraph_style(paragraph, size=10.5)

    document.add_heading("3. 需求比对矩阵", level=1)
    add_table(
        document,
        ["模块", "原始需求摘要", "当前状态", "说明"],
        COMPARISON_ROWS,
    )

    document.add_heading("4. 与前三类设备的对比", level=1)
    add_table(
        document,
        ["设备", "现有能力概况", "与智能OTDR可共用点", "差异说明"],
        DEVICE_COMPARISON_ROWS,
    )

    document.add_heading("5. 可复用能力梳理", level=1)
    add_table(
        document,
        ["可复用域", "智能OTDR当前对应功能", "复用来源", "建议"],
        REUSE_ROWS,
    )

    document.add_heading("6. 复用与重构优先级建议", level=1)
    add_bullets(document, RECOMMENDATIONS)

    document.add_heading("7. 结论", level=1)
    conclusions = [
        "从功能覆盖角度看，当前智能 OTDR 已完成交接书中的核心前端能力框架，尤其是 OTDR 主测量、参数门限、事件地图、Smart OPM、光源、VFL、网线测试、事件分析入口等模块。",
        "从交接书的完整要求看，当前项目仍以“静态页面 + Mock 数据”实现为主，涉及 APD 自动补偿、真实 4G 远程、USB-A 外设采集、真实文件介质流转、硬件性能指标等能力尚未在前端项目中被完整承载。",
        "从架构角度看，智能 OTDR 已成为综合测量平台页面，后续最有价值的工作不是继续单页复制，而是把前三类设备的已成型能力抽象成公共模块，供智能 OTDR 与其他设备共用。",
    ]
    add_bullets(document, conclusions)

    document.add_heading("8. 代码依据", level=1)
    for item in SOURCE_FILES:
        p = document.add_paragraph(style="List Bullet")
        p.add_run(item)
        set_paragraph_style(p, size=10.5)

    document.save(str(DOCX_PATH))


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MD_PATH.write_text(build_markdown(), encoding="utf-8")
    build_docx()
    print(DOCX_PATH)


if __name__ == "__main__":
    main()
