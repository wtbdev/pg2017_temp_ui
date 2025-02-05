messages = {
    "en": {
        "home": "Home",
        "lobbies": "Lobbies",
        "friends": "Friends",
        "match_custom": "Custom Match",
        "match_public": "Public Match",
        "start": "START",
        "discord_join": "Join Our Discord",
        "discord_join_description": "Join our Discord server to get the latest updates, ask questions, and interact with the community.",
        "region": "Region",
        "warning_title": "Important Tip",
        "warning_text": "ATTENTION!! IF YOU BOUGHT THIS GAME, YOU GOT SCAMMED!!This is a free, open source private server for PUBG 2017."
    },
    "zh-CN": {
        "home": "主页",
        "lobbies": "大厅",
        "friends": "好友",
        "match_custom": "自定义对战",
        "match_public": "公开对战",
        "start": "开始",
        "discord_join": "加入 Discord",
        "discord_join_description": "加入我们的 Discord 服务器以获取最新更新，报告问题或与社区互动。",
        "region": "地区",
        "warning_title": "提示",
        "warning_text": "注意！如果您从他人手中购买本游戏，您可能被骗了！OGBG是完全免费并开源的。"
    }
}

function l(message, format) {
    try {
        var localeText = messages[app.language][message];
    } catch (e) {
        if (messages[navigator.language]) {
            var localeText = messages[navigator.language][message];
        } else {
            var localeText = messages["en"][message];
        }
    }
    
    if (format) {
        for (val in format) {
            localeText = localeText.replace("{" + val + "}", format[val]);
        }
        return localeText;
    } else {
        return localeText;
    }
}

function setLanguage(lang, app) {
    app.language = lang;
}