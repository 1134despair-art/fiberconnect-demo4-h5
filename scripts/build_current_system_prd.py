from pathlib import Path
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path(r"c:\Users\EDY\Desktop\工作文件\嗨创\入职培训资料\demo\demo4\APP")
OUTPUT_DIR = ROOT / "docs" / "deliverables"
ASSET_DIR = ROOT / "docs" / "prd-assets" / "20260701-prd"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DOCX_PATH = OUTPUT_DIR / "PRD-当前系统功能全景梳理-20260701.docx"
MD_PATH = OUTPUT_DIR / "PRD-当前系统功能全景梳理-20260701.md"


def set_run_style(run, size=10.5, bold=False, color=None, italic=False):
    run.bold = bold
    run.italic = italic
    run.font.name = "Microsoft YaHei"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = RGBColor(*color)


def set_cell_text(cell, text, bold=False, size=10.0):
    cell.text = ""
    paragraph = cell.paragraphs[0]
    run = paragraph.add_run(str(text))
    set_run_style(run, size=size, bold=bold)


def configure_styles(doc):
    styles = doc.styles
    for name, size, bold in [
        ("Normal", 10.5, False),
        ("Heading 1", 15.5, True),
        ("Heading 2", 12.5, True),
        ("Heading 3", 11.0, True),
    ]:
        style = styles[name]
        style.font.name = "Microsoft YaHei"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
        style.font.size = Pt(size)
        style.font.bold = bold


def add_heading(doc, text, level=1):
    paragraph = doc.add_paragraph()
    paragraph.style = f"Heading {level}"
    run = paragraph.add_run(text)
    set_run_style(run, size=15.5 if level == 1 else 12.5 if level == 2 else 11.0, bold=True)
    return paragraph


def add_paragraph(doc, text, bold=False, size=10.5, color=None, italic=False, align=None, space_after=6):
    paragraph = doc.add_paragraph()
    if align is not None:
        paragraph.alignment = align
    run = paragraph.add_run(text)
    set_run_style(run, size=size, bold=bold, color=color, italic=italic)
    paragraph.paragraph_format.space_after = Pt(space_after)
    return paragraph


def add_bullets(doc, items):
    for item in items:
        paragraph = doc.add_paragraph(style="List Bullet")
        run = paragraph.add_run(item)
        set_run_style(run)
        paragraph.paragraph_format.space_after = Pt(4)


def add_numbered(doc, items):
    for item in items:
        paragraph = doc.add_paragraph(style="List Number")
        run = paragraph.add_run(item)
        set_run_style(run)
        paragraph.paragraph_format.space_after = Pt(4)


def add_kv_table(doc, rows):
    table = doc.add_table(rows=0, cols=2)
    table.style = "Table Grid"
    for left, right in rows:
        row = table.add_row().cells
        set_cell_text(row[0], left, bold=True)
        set_cell_text(row[1], right)
    doc.add_paragraph()


def add_grid_table(doc, headers, rows):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    for index, header in enumerate(headers):
        set_cell_text(table.rows[0].cells[index], header, bold=True)
    for row_data in rows:
        row = table.add_row().cells
        for index, value in enumerate(row_data):
            set_cell_text(row[index], value)
    doc.add_paragraph()


def add_screenshot(doc, filename, caption, width=5.8):
    image_path = ASSET_DIR / filename
    if not image_path.exists():
        return
    doc.add_picture(str(image_path), width=Inches(width))
    caption_paragraph = doc.add_paragraph()
    caption_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = caption_paragraph.add_run(caption)
    set_run_style(run, size=9.5, italic=True, color=(102, 102, 102))
    doc.add_paragraph()


def add_page_field(paragraph, label):
    if label:
        label_run = paragraph.add_run(label)
        set_run_style(label_run, size=9, color=(100, 116, 139))
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")

    run = paragraph.add_run()
    set_run_style(run, size=9, color=(100, 116, 139))
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_sep)
    run._r.append(fld_end)


def configure_header_footer(doc):
    section = doc.sections[0]
    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if not header.text:
        run = header.add_run("智能 OTDR 应用 | 现状型 PRD")
        set_run_style(run, size=8.5, color=(148, 163, 184))

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_page_field(footer, "第 ")
    tail = footer.add_run(" 页")
    set_run_style(tail, size=9, color=(100, 116, 139))


doc_meta = {
    "文档名称": "当前系统功能全景梳理 PRD",
    "文档类型": "现状型产品需求文档 / 对外协作版",
    "适用对象": "外部合作人员、开发人员、产品经理、交付与运维团队",
    "版本": "V1.3",
    "文档日期": "2026-07-01",
    "编制依据": "当前系统前端代码、运行界面、crewAI-main 目录中的技能化文档组织思路",
    "说明": "本文档聚焦前端已实现能力，不包含 API、接口、数据库与后端实现说明"
}

toc_sections = [
    "文档信息",
    "版本记录",
    "阅读说明",
    "产品概述",
    "业务背景与文档目标",
    "用户角色与核心场景",
    "范围边界",
    "四类设备矩阵",
    "四设备能力对比",
    "页面地图",
    "核心流程",
    "核心业务模块",
    "平台支撑模块",
    "数据与状态说明",
    "非功能要求",
    "模块优先级与后续规划",
    "当前限制与风险",
    "协作建议",
    "附录：页面截图索引",
]

version_history = [
    ("V1.0", "2026-07-01", "生成系统功能全景梳理首版文档"),
    ("V1.1", "2026-07-01", "补充四类设备矩阵与设备能力说明"),
    ("V1.2", "2026-07-01", "按专业 PRD 结构重构章节，并扩充截图池、减少重复配图"),
    ("V1.3", "2026-07-01", "增强正式交付版式，补充目录、设备对比表、模块优先级与规划建议"),
]

document_guide = [
    "本文档是面向合作方、研发、产品和交付团队的现状型 PRD，不是接口文档，也不是详细技术设计文档。",
    "文档目标是让阅读者在较短时间内理解系统范围、设备矩阵、页面结构、核心流程和当前交付边界。",
    "截图全部来自当前系统运行界面，优先保证图文一一对应，避免同一张图在多个章节重复出现。"
]

product_summary = [
    "本系统是一套移动端设备管理与光通信检测演示应用，采用 Vue 3 + TypeScript + Vite 构建，当前以前端 Mock 数据驱动为主。",
    "系统既包含登录、首页、产品中心、个人中心、售后订单等平台能力，也包含多设备接入与设备详情分支能力。",
    "当前首页已接入四类设备：熔接机、便携式 OTDR、多功能光功率计、智能 OTDR，形成了多设备共存的演示矩阵。",
    "其中智能 OTDR 是当前功能最完整的设备分支，已经形成统一的设备端交互基线和页面风格。"
]

business_background = [
    "在当前演示版本中，系统需要同时服务于设备展示、方案讲解、外部合作评估和后续研发接手。",
    "因此 PRD 既要覆盖平台级页面，也要覆盖四类设备的差异化能力与入口结构。",
    "由于现阶段以前端静态演示为主，文档重点应放在页面能力、用户路径、状态变化和协作边界，而不是接口定义。"
]

project_goals = [
    "让合作方快速理解当前系统已实现的页面能力和模块边界。",
    "让产品经理能够从设备矩阵、流程和模块层面复盘当前产品形态。",
    "让开发人员在不依赖后端说明的前提下，理解前端页面结构、Mock 数据模式与后续扩展方向。"
]

target_users = [
    ("一线检测与维护人员", "通过移动端快速进入具体设备页面，执行测量、查看结果、管理文件与基础设置。"),
    ("产品经理与交付人员", "基于统一页面梳理当前功能边界、设备能力结构和交付沟通口径。"),
    ("外部合作开发团队", "在不依赖接口文档的前提下，理解页面结构、模块职责和后续接手方式。"),
    ("运维与实施人员", "了解当前系统采用 Hash 路由的静态站点部署方式，便于部署与联调。"),
]

core_scenarios = [
    "用户登录后进入首页，查看已添加设备、连接状态和激活状态。",
    "用户按设备类型进入设备详情页，依据设备能力矩阵访问不同功能入口。",
    "智能 OTDR 设备用户可完成测量、事件分析、文件管理与辅助检测形成闭环。",
    "平台侧用户可浏览产品中心、查看个人中心、提交售后申请并跟踪订单状态。"
]

scope_in = [
    "登录认证、首页设备列表、设备详情页。",
    "四类设备分支：熔接机、便携式 OTDR、多功能光功率计、智能 OTDR。",
    "智能 OTDR 深度模块：测量、事件地图、文件管理、智能光功率计、损耗测试、光源、红光源、网线测试、系统设置。",
    "平台模块：通用设置、产品分类、产品详情、个人中心、售后订单。"
]

scope_out = [
    "API、接口协议、数据库结构、Java 或后端服务实现。",
    "真实蓝牙通信、真实硬件协议、真实测量算法输出。",
    "运维脚本、服务端权限体系、生产监控体系。"
]

device_matrix = [
    {
        "type": "熔接机",
        "demo_device": "六马达熔接机-001 / WM-6000",
        "positioning": "以熔接工艺与维护操作为核心的施工设备入口。",
        "home_route": "/device/device_001",
        "key_modules": "OPM / 红光源 / OTDR / 熔接设置 / 维护 / 熔接记录 / 系统设置",
        "image": ("14-fusion-home.png", "图 1 熔接机设备首页"),
        "details": [
            "设备首页采用传统设备卡片式布局，集中呈现连接状态、基础环境信息、激活状态和开机密码设置入口。",
            "熔接设置页支持预熔电流、预熔时间、熔接电流、熔接时间、清洁参数、加热参数等多项步进调节。",
            "该分支适合作为施工类设备的综合演示样板，突出工艺参数和维护操作能力。"
        ]
    },
    {
        "type": "便携式 OTDR",
        "demo_device": "便携式OTDR测试仪-001 / FWV-100-V10",
        "positioning": "强调现场波形测量与快速诊断的轻量 OTDR 设备。",
        "home_route": "/device/device_006",
        "key_modules": "OTDR 测量 / 手电筒 / 红光源 / 系统设置",
        "image": ("15-portable-otdr-home.png", "图 2 便携式 OTDR 设备首页"),
        "details": [
            "设备详情页突出量程、波长、电池等随身型 OTDR 的常用信息，入口数量更聚焦。",
            "OTDR 测量页提供波形画布、测量状态、量程与脉宽切换、实时与平均模式切换。",
            "页面同时保留手电筒与红光源等辅助能力，贴近现场巡检与排障流程。"
        ]
    },
    {
        "type": "多功能光功率计",
        "demo_device": "手持式多功能光功率计-001 / MOPM-4G",
        "positioning": "以光功率测量为主，同时整合线缆辅助能力的复合型终端。",
        "home_route": "/device/device_007",
        "key_modules": "光功率计 / 功率记录 / 网络对线 / 寻线 / 光源 / 系统设置",
        "image": ("16-multi-opm-home.png", "图 3 多功能光功率计设备首页"),
        "details": [
            "设备首页展示功率范围、分辨率、精度、频率识别能力，并提供多入口操作矩阵。",
            "主测量页采用状态卡、波长卡、控制卡结构，支持设参考和保存测量数据。",
            "历史记录页支持查看多条功率记录和单条详情，体现多功能仪表的本地结果管理思路。"
        ]
    },
    {
        "type": "智能 OTDR",
        "demo_device": "智能OTDR测试仪-001 / SOTDR-200",
        "positioning": "当前系统的主设备形态，承载最完整的检测、分析与文件协同链路。",
        "home_route": "/device/1782294527369",
        "key_modules": "测量 / 事件地图 / 文件管理 / 智能光功率计 / 损耗测试 / 光源 / 红光源 / 网线测试 / 系统设置",
        "image": ("03-smart-otdr-home.png", "图 4 智能 OTDR 设备首页"),
        "details": [
            "首页采用统一壳层布局，聚焦设备主信息、能力摘要、激活状态和分组操作入口。",
            "该设备已打通从测量、事件分析、文件管理到辅助测量和系统设置的完整演示链路。",
            "全局快捷入口已在智能 OTDR 相关页面统一接入，可固定区域拖拽并记忆位置。"
        ]
    }
]

device_compare_headers = [
    "设备类型",
    "定位",
    "核心模块数",
    "页面风格",
    "当前完成度",
    "协作重点",
]

device_compare_rows = [
    ("熔接机", "施工熔接", "7", "传统设备卡片式", "中", "参数项与真实硬件映射"),
    ("便携式 OTDR", "现场诊断", "4", "硬件感操作页", "中", "测量链路与历史结果深化"),
    ("多功能光功率计", "仪表测量", "6", "状态卡片式", "中", "历史记录与组合功能联动"),
    ("智能 OTDR", "主设备平台", "9", "统一家族壳层", "高", "维持统一交互与模块扩展"),
]

page_architecture = [
    ("/login", "登录页", "支持手机号验证码登录和邮箱密码登录。"),
    ("/", "首页", "展示用户信息、设备列表、添加设备与蓝牙扫描。"),
    ("/device/:id", "设备详情", "按设备类型进入不同能力主页。"),
    ("/device/:id/smart-otdr", "智能 OTDR 测量", "测量、曲线、参数设置、门限设置、结果查看。"),
    ("/device/:id/event-map", "事件地图", "事件分析、参数门限设置、表格查看、返回文件或 OTDR。"),
    ("/device/:id/files", "文件管理", "目录树、文件列表、加载、复制、剪切、粘贴、重命名、删除、文件设置。"),
    ("/device/:id/smart-opm", "智能光功率计", "开启关闭、波长切换、设为参考、参考置零、校准。"),
    ("/device/:id/loss-test", "损耗测试", "启停、波长切换、参考设置、相对功率展示。"),
    ("/device/:id/light-source", "光源", "开启关闭、波长切换、频率切换。"),
    ("/device/:id/vfl", "红光源", "常亮、2Hz、关闭、使用记录。"),
    ("/device/:id/cable-test", "网线测试", "线序、线长、寻线三类检测。"),
    ("/device/:id/system", "设备系统设置", "基础设置、系统入口、连接信息与升级入口。"),
    ("/settings", "通用设置", "个人资料、语言、售后、关于、退出登录。"),
    ("/catalog", "产品分类", "左侧分类、右侧产品卡片列表。"),
    ("/product/:id", "产品详情", "产品介绍、产品详情、申请售后。"),
    ("/profile", "个人中心", "头像信息、技能、统计、账户菜单、最近活动。"),
    ("/after-sales", "售后订单", "创建售后单、查看订单状态与物流信息。"),
]

main_flows = [
    "用户登录后进入首页，查看设备列表、设备连接状态和激活状态。",
    "点击设备进入设备详情页，系统根据设备类型展示差异化能力入口。",
    "智能 OTDR 设备用户可进一步进入测量、事件地图、文件管理等深度模块。",
    "文件管理中的 OTDR 文件和事件地图文件均可点击加载，并统一跳转到智能 OTDR 测量页。",
    "平台用户可从设置、产品中心、个人中心和售后订单模块完成非设备侧业务操作。"
]

core_module_sections = [
    {
        "title": "1. 智能 OTDR 测量",
        "image": ("04-smart-otdr-measure.png", "图 5 智能 OTDR 测量页"),
        "content": [
            "测量页展示当前文件、波长、脉宽、A-B 距离、损耗、平均损耗等关键指标。",
            "页面由曲线区、测试状态区、操作按钮区和结果列表区组成，适合讲清 OTDR 核心作业链路。",
            "设置弹窗区分测量参数和阈值参数两个标签页，支持参数保存、门限保存与校准相关操作。"
        ]
    },
    {
        "title": "2. 事件地图",
        "image": ("05-event-map.png", "图 6 事件地图页"),
        "content": [
            "事件地图页集中展示文件名称、运行状态、链路指标与事件数量。",
            "中部区域通过轨迹图、刻度和事件标签表达链路分布，下部表格展示距离、损耗、斜率、反射等字段。",
            "支持运行事件分析、保存结果、打开参数或阈值设置，并返回 OTDR 或文件页。"
        ]
    },
    {
        "title": "3. 文件管理",
        "image": ("06-file-manager.png", "图 7 文件管理页"),
        "content": [
            "文件管理采用左侧目录树、右侧文件区与操作区的混合布局，适合作为结果资产管理中心。",
            "当前仅保留两类核心文件：OTDR 文件和事件地图文件，两类文件都可加载并统一跳转到智能 OTDR 测量页。",
            "支持复制、剪切、粘贴、重命名、删除以及进入文件设置页维护命名规则、保存格式、测试人和任务号等字段。"
        ]
    },
    {
        "title": "4. 智能光功率计",
        "image": ("07-smart-opm.png", "图 8 智能光功率计"),
        "content": [
            "页面采用主读数卡与功能操作卡组合，突出当前功率读数。",
            "支持开启关闭、波长切换、设为参考、参考置零与校准。",
            "校准态支持切换校准波长并通过步进器调整校准值。"
        ]
    },
    {
        "title": "5. 损耗测试",
        "image": ("08-loss-test.png", "图 9 损耗测试"),
        "content": [
            "页面展示当前波长、状态、线性功率、参考值和相对功率。",
            "支持开启关闭、波长切换、设为参考和参考置零。",
            "整体保留设备端仪表屏风格，更突出测试状态与过程读数。"
        ]
    },
    {
        "title": "6. 光源",
        "image": ("10-light-source.png", "图 10 光源"),
        "content": [
            "光源页采用状态卡与功能操作卡双卡结构，强调当前工作状态与波长参数。",
            "支持开启关闭、波长切换、频率切换。",
            "页面已接入全局快捷入口，并受固定区域拖拽约束。"
        ]
    },
    {
        "title": "7. 红光源",
        "image": ("11-vfl.png", "图 11 红光源"),
        "content": [
            "红光源页面保留常亮、2Hz、关闭三种模式，突出硬件可用模式与页面操作一致性。",
            "页面保留使用记录列表，支持单条删除、清空记录和分页切换。",
            "视觉风格已与光源页面统一，并接入全局快捷入口。"
        ]
    },
    {
        "title": "8. 网线测试",
        "image": ("12-cable-test.png", "图 12 网线测试"),
        "content": [
            "网线测试分为二级菜单页和三级工具页，覆盖线序、线长、寻线三类检测入口。",
            "工具页展示当前标准、异常端口、检测结果板和返回菜单按钮。",
            "支持 T568A 和 T568B 标准切换以及不同模式下的 Mock 结果展示。"
        ]
    },
    {
        "title": "9. 设备系统设置",
        "image": ("13-system-settings.png", "图 13 设备系统设置"),
        "content": [
            "智能 OTDR 的系统设置页采用轻量卡片列表形式。",
            "包含基础设置、连接信息、语言、升级和系统入口等内容。",
            "该模块承担设备侧配置入口的统一收口角色。"
        ]
    }
]

platform_module_sections = [
    {
        "title": "1. 登录与认证",
        "image": ("01-login.png", "图 15 登录页"),
        "content": [
            "系统支持手机号验证码登录与邮箱密码登录两种方式。",
            "登录成功后把用户信息和 token 保存在本地存储中，适用于当前 Mock 演示场景。",
            "认证态校验在前端路由守卫中完成。"
        ]
    },
    {
        "title": "2. 首页与设备管理",
        "image": ("02-home.png", "图 16 首页设备列表"),
        "content": [
            "首页展示当前登录用户、设备数量、已激活和未激活设备分组。",
            "支持添加设备、蓝牙扫描、连接设备、设备激活动作和进入设备详情页。",
            "首页是四类设备矩阵的统一入口。"
        ]
    },
    {
        "title": "3. 通用设置",
        "image": ("17-settings.png", "图 17 通用设置页"),
        "content": [
            "通用设置页承接个人资料、语言切换、售后服务、关于应用和退出登录。",
            "它与设备系统设置形成平台侧与设备侧的双层设置结构。",
            "适合作为平台级配置能力的统一入口。"
        ]
    },
    {
        "title": "4. 产品分类",
        "image": ("18-catalog.png", "图 18 产品分类页"),
        "content": [
            "产品分类页采用左侧分类、右侧产品列表的双区布局。",
            "支持按分类查看产品数量、浏览产品卡片并进入产品详情页。",
            "该模块承担产品展示与售前信息分发功能。"
        ]
    },
    {
        "title": "5. 产品详情",
        "image": ("19-product-detail.png", "图 19 产品详情页"),
        "content": [
            "产品详情页展示产品名称、型号、简介与详细说明。",
            "底部提供申请售后按钮，可从产品内容直接触达售后链路。",
            "适合作为销售资料、产品说明和售后入口的结合页。"
        ]
    },
    {
        "title": "6. 个人中心",
        "image": ("20-profile.png", "图 20 个人中心页"),
        "content": [
            "个人中心页展示用户头像、联系方式、角色、技能标签和个人统计。",
            "页面同时提供账户管理菜单和最近活动列表。",
            "它是平台侧用户信息与账户操作的主要承载页。"
        ]
    },
    {
        "title": "7. 售后订单",
        "image": ("21-after-sales.png", "图 21 售后订单页"),
        "content": [
            "售后订单页支持创建售后单、查看订单状态、问题描述与物流信息。",
            "页面通过列表与弹窗组合完成订单创建、详情查看和状态回显。",
            "该模块是平台级服务闭环的重要组成部分。"
        ]
    }
]

data_state_notes = [
    "认证信息通过 localStorage 存储，路由守卫基于本地认证态完成访问控制。",
    "当前页面数据以前端 Mock 数据为主，适合方案演示、评审和前端协作开发。",
    "文件管理中的文件加载依赖前端本地状态传递，OTDR 文件与事件地图文件统一跳转到智能 OTDR 测量页。",
    "系统采用 Hash 路由模式，静态资源部署即可访问，部署时通常不依赖服务端路由重写。"
]

non_functional = [
    "前端技术栈：Vue 3、TypeScript、Vue Router、Vue I18n、Vite。",
    "视觉基线：智能 OTDR 页面已统一到设备端 APP / 小程序风格，强调单列卡片、统一壳层、清晰层级和简洁操作路径。",
    "交互要求：快捷入口支持拖拽、位置记忆和固定区域约束，敏感操作统一使用系统级确认弹窗。",
    "部署形态：前端静态站点，适合打包后直接交付运维部署。"
]

limitations = [
    "当前系统属于前端演示系统，测量结果、文件结构、售后订单、蓝牙连接等均为 Mock 或前端本地模拟。",
    "文档不描述任何接口、后端、数据库、蓝牙协议或硬件串口通信细节。",
    "部分传统设备页面已经具备功能入口，但后续仍可按真实设备原型细化字段和操作流程。",
    "当前文档强调现状梳理与协作交付，不替代后续详细技术设计文档。"
]

collab_notes = [
    "对外合作建议以本 PRD 为界面和流程基线，优先保证页面结构、状态流转和交互一致性。",
    "开发团队接手时，可优先按模块拆分为认证与首页、设备详情、智能 OTDR 深度模块、平台模块四大工作包。",
    "若后续接入真实接口，建议保持当前页面结构和用户路径不变，仅替换数据源与状态管理层。",
    "若继续扩展智能 OTDR 家族页面，应延续统一壳层、统一弹窗和统一快捷入口机制。"
]

priority_plan = [
    ("P0", "智能 OTDR 核心测量链路", "测量、事件地图、文件管理", "主业务闭环，优先保证演示和协作一致性"),
    ("P0", "四设备首页与能力矩阵", "首页、设备详情、激活态、能力入口", "是合作方理解系统范围的第一入口"),
    ("P1", "平台支撑模块", "设置、产品、个人中心、售后", "支撑完整业务闭环和平台化认知"),
    ("P1", "传统设备深度页", "熔接设置、便携 OTDR、多功能光功率计", "便于后续按硬件原型继续细化"),
    ("P2", "数据与接口替换层", "Mock 到真实接口的替换", "后续研发接手时再逐步推进"),
]

roadmap_notes = [
    "短期建议：保持现有页面结构不变，优先补足真实状态机、字段来源和接口映射关系。",
    "中期建议：建立四设备统一能力模型，把设备首页、设备态和功能入口映射到可配置结构。",
    "长期建议：把智能 OTDR 统一壳层、快捷入口、系统弹窗沉淀为设备页面标准组件库。"
]

screenshot_map = [
    ("01-login.png", "登录页"),
    ("02-home.png", "首页"),
    ("03-smart-otdr-home.png", "智能 OTDR 设备首页"),
    ("04-smart-otdr-measure.png", "智能 OTDR 测量页"),
    ("05-event-map.png", "事件地图"),
    ("06-file-manager.png", "文件管理"),
    ("07-smart-opm.png", "智能光功率计"),
    ("08-loss-test.png", "损耗测试"),
    ("10-light-source.png", "光源"),
    ("11-vfl.png", "红光源"),
    ("12-cable-test.png", "网线测试"),
    ("13-system-settings.png", "设备系统设置"),
    ("14-fusion-home.png", "熔接机设备首页"),
    ("15-portable-otdr-home.png", "便携式 OTDR 设备首页"),
    ("16-multi-opm-home.png", "多功能光功率计设备首页"),
    ("17-settings.png", "通用设置页"),
    ("18-catalog.png", "产品分类页"),
    ("19-product-detail.png", "产品详情页"),
    ("20-profile.png", "个人中心页"),
    ("21-after-sales.png", "售后订单页"),
]


def build_markdown():
    lines = []
    lines.append("# 当前系统功能全景梳理 PRD")
    lines.append("")
    lines.append("## 文档信息")
    for key, value in doc_meta.items():
        lines.append(f"- **{key}**：{value}")
    lines.append("")
    lines.append("## 版本记录")
    for version, date, change in version_history:
        lines.append(f"- {version} | {date} | {change}")
    lines.append("")
    lines.append("## 目录")
    for index, item in enumerate(toc_sections, start=1):
        lines.append(f"{index}. {item}")
    lines.append("")
    lines.append("## 阅读说明")
    for item in document_guide:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 产品概述")
    for item in product_summary:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 业务背景")
    for item in business_background:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 文档目标")
    for item in project_goals:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 目标用户")
    for role, desc in target_users:
        lines.append(f"- **{role}**：{desc}")
    lines.append("")
    lines.append("## 核心场景")
    for item in core_scenarios:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 范围边界")
    lines.append("### 包含范围")
    for item in scope_in:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("### 不包含范围")
    for item in scope_out:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 四类设备矩阵")
    for item in device_matrix:
        lines.append(f"### {item['type']}")
        lines.append(f"- 演示设备：{item['demo_device']}")
        lines.append(f"- 设备定位：{item['positioning']}")
        lines.append(f"- 首页路由：`{item['home_route']}`")
        lines.append(f"- 关键模块：{item['key_modules']}")
        for detail in item["details"]:
            lines.append(f"- {detail}")
        lines.append("")
    lines.append("## 四设备能力对比")
    for row in device_compare_rows:
        lines.append(f"- **{row[0]}** | 定位：{row[1]} | 核心模块数：{row[2]} | 页面风格：{row[3]} | 当前完成度：{row[4]} | 协作重点：{row[5]}")
    lines.append("")
    lines.append("## 页面地图")
    for route, name, desc in page_architecture:
        lines.append(f"- `{route}` | {name} | {desc}")
    lines.append("")
    lines.append("## 核心流程")
    for index, item in enumerate(main_flows, start=1):
        lines.append(f"{index}. {item}")
    lines.append("")
    lines.append("## 核心业务模块")
    for section in core_module_sections:
        lines.append(f"### {section['title']}")
        for item in section["content"]:
            lines.append(f"- {item}")
        lines.append("")
    lines.append("## 平台支撑模块")
    for section in platform_module_sections:
        lines.append(f"### {section['title']}")
        for item in section["content"]:
            lines.append(f"- {item}")
        lines.append("")
    lines.append("## 数据与状态说明")
    for item in data_state_notes:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 非功能要求")
    for item in non_functional:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 模块优先级与后续规划")
    for row in priority_plan:
        lines.append(f"- **{row[0]}** | {row[1]} | 范围：{row[2]} | 说明：{row[3]}")
    lines.append("")
    lines.append("### 后续规划建议")
    for item in roadmap_notes:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 当前限制与风险")
    for item in limitations:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 协作建议")
    for item in collab_notes:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 页面截图索引")
    for filename, page_name in screenshot_map:
        lines.append(f"- `{filename}` | {page_name}")
    lines.append("")
    MD_PATH.write_text("\n".join(lines), encoding="utf-8")


def build_docx():
    doc = Document()
    configure_styles(doc)
    configure_header_footer(doc)

    section = doc.sections[0]
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.85)
    section.right_margin = Inches(0.85)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title.add_run("当前系统功能全景梳理 PRD")
    set_run_style(title_run, size=22, bold=True, color=(17, 24, 39))

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle_run = subtitle.add_run("面向外部合作、研发、产品与交付团队的现状型产品需求文档")
    set_run_style(subtitle_run, size=11, color=(90, 90, 90))

    add_paragraph(
        doc,
        "本版本重点优化为专业 PRD 交付结构，补齐平台模块截图，并减少重复配图。",
        size=10.5,
        color=(75, 85, 99),
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )
    add_paragraph(
        doc,
        "适用对象：外部合作人员 / 开发人员 / 产品经理 / 交付与运维团队",
        size=10,
        color=(59, 130, 246),
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )
    doc.add_paragraph()
    add_paragraph(doc, "2026-07-01", size=10, color=(100, 116, 139), align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_page_break()

    add_heading(doc, "目录", level=1)
    for index, item in enumerate(toc_sections, start=1):
        add_paragraph(doc, f"{index}. {item}", size=10.5)
    doc.add_page_break()

    add_heading(doc, "文档信息", level=1)
    add_kv_table(doc, list(doc_meta.items()))

    add_heading(doc, "版本记录", level=1)
    add_grid_table(doc, ["版本", "日期", "更新说明"], version_history)

    add_heading(doc, "阅读说明", level=1)
    add_bullets(doc, document_guide)
    doc.add_page_break()

    add_heading(doc, "1. 产品概述", level=1)
    for item in product_summary:
        add_paragraph(doc, item)

    add_heading(doc, "2. 业务背景与文档目标", level=1)
    add_heading(doc, "2.1 业务背景", level=2)
    add_bullets(doc, business_background)
    add_heading(doc, "2.2 文档目标", level=2)
    add_bullets(doc, project_goals)

    add_heading(doc, "3. 用户角色与核心场景", level=1)
    add_grid_table(doc, ["角色", "说明"], target_users)
    add_heading(doc, "3.1 核心场景", level=2)
    add_bullets(doc, core_scenarios)

    add_heading(doc, "4. 范围边界", level=1)
    add_heading(doc, "4.1 包含范围", level=2)
    add_bullets(doc, scope_in)
    add_heading(doc, "4.2 不包含范围", level=2)
    add_bullets(doc, scope_out)

    add_heading(doc, "5. 四类设备矩阵", level=1)
    add_grid_table(
        doc,
        ["设备类型", "演示设备", "设备定位", "首页路由"],
        [(item["type"], item["demo_device"], item["positioning"], item["home_route"]) for item in device_matrix],
    )
    add_grid_table(
        doc,
        ["设备类型", "关键模块"],
        [(item["type"], item["key_modules"]) for item in device_matrix],
    )
    for item in device_matrix:
        add_heading(doc, item["type"], level=2)
        for detail in item["details"]:
            add_paragraph(doc, detail)
        filename, caption = item["image"]
        add_screenshot(doc, filename, caption)

    add_heading(doc, "6. 四设备能力对比", level=1)
    add_grid_table(doc, device_compare_headers, device_compare_rows)

    add_heading(doc, "7. 页面地图", level=1)
    add_grid_table(doc, ["路由", "页面", "说明"], page_architecture)

    add_heading(doc, "8. 核心流程", level=1)
    add_numbered(doc, main_flows)

    add_heading(doc, "9. 核心业务模块", level=1)
    for section_data in core_module_sections:
        add_heading(doc, section_data["title"], level=2)
        for item in section_data["content"]:
            add_paragraph(doc, item)
        filename, caption = section_data["image"]
        add_screenshot(doc, filename, caption)

    add_heading(doc, "10. 平台支撑模块", level=1)
    for section_data in platform_module_sections:
        add_heading(doc, section_data["title"], level=2)
        for item in section_data["content"]:
            add_paragraph(doc, item)
        filename, caption = section_data["image"]
        add_screenshot(doc, filename, caption)

    add_heading(doc, "11. 数据与状态说明", level=1)
    add_bullets(doc, data_state_notes)

    add_heading(doc, "12. 非功能要求", level=1)
    add_bullets(doc, non_functional)

    add_heading(doc, "13. 模块优先级与后续规划", level=1)
    add_grid_table(doc, ["优先级", "模块", "范围", "说明"], priority_plan)
    add_heading(doc, "13.1 后续规划建议", level=2)
    add_bullets(doc, roadmap_notes)

    add_heading(doc, "14. 当前限制与风险", level=1)
    add_bullets(doc, limitations)

    add_heading(doc, "15. 协作建议", level=1)
    add_bullets(doc, collab_notes)

    add_heading(doc, "16. 附录：页面截图索引", level=1)
    add_paragraph(doc, "以下截图均来自当前系统运行界面，用于辅助合作方、开发与产品经理快速理解页面结构。")
    add_grid_table(doc, ["截图文件", "对应页面"], screenshot_map)

    doc.save(str(DOCX_PATH))


if __name__ == "__main__":
    build_markdown()
    build_docx()
    print(f"DOCX={DOCX_PATH}")
    print(f"MD={MD_PATH}")
