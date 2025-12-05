const fs = require('fs');

fs.writeFileSync(__dirname + '/public/config.json', JSON.stringify({
    server: process.env.NEXT_PUBLIC_S3APP_LICENSE_REPOSITORY_SERVER || '',
    noConfirmation: !!process.env.NEXT_PUBLIC_S3APP_LICENSE_REPOSITORY_NO_CONFIRMATION || false,
    yandexKey: process.env.YANDEX_KEY || '',
    domain: process.env.MMCMS_DOMAIN || '',
    noHeader: !!process.env.MMCMS_NO_HEADER || false
}, null, 4));