const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');

// read the index.html from build folder
let data = fs.readFileSync('./build/index.html', 'utf8');

function insertContent(fullContent, beforeWhat, newContent) {
    // get the position before which newContent has to be added
    const position = fullContent.indexOf(beforeWhat);

    // since splice can be used on arrays only
    let fullContentCopy = fullContent.split('');
    fullContentCopy.splice(position, 0, newContent);

    return fullContentCopy.join('');
}

// will add the <meta> tags needed for cordova app
const afterAddingMeta = insertContent(data, "<link",
`<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *; img-src 'self' data: content:;">`+
`<meta name="format-detection" content="telephone=no">`+
`<meta name="msapplication-tap-highlight" content="no">`
);

// will add <script> pointing to cordova.js
const afterAddingScript = insertContent(afterAddingMeta, "<script", `<script type="text/javascript" src="cordova.js"></script>`);

// updates the index.html file
fs.writeFile('./build/index.html', afterAddingScript, 'utf8', (err)=> {
    if(err) {
        throw err
    };
})


function renameOutputFolder(buildFolderPath, outputFolderPath) {
    return new Promise((resolve, reject) => {
        fs.rename(buildFolderPath, outputFolderPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve('Successfully built!');
            }
        });
    });
}

function execPostReactBuild(buildFolderPath, outputFolderPath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(buildFolderPath)) {
            if (fs.existsSync(outputFolderPath)) {
                rimraf(outputFolderPath, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    renameOutputFolder(buildFolderPath, outputFolderPath)
                        .then(val => resolve(val))
                        .catch(e => reject(e));
                });
            } else {
                renameOutputFolder(buildFolderPath, outputFolderPath)
                    .then(val => resolve(val))
                    .catch(e => reject(e));
            }
        } else {
            reject(new Error('build folder does not exist'));
        }
    });
}

module.exports = () => {
    const projectPath = path.resolve(process.cwd(), './node_modules/.bin/react-scripts');
    return new Promise((resolve, reject) => {
        exec(`${projectPath} build`,
            (error) => {
                if (error) {
                    console.error(error);
                    reject(error);
                    return;
                }
                execPostReactBuild(path.resolve(__dirname, '../build/'), path.join(__dirname, '../www/'))
                    .then((s) => {
                        console.log(s);
                        resolve(s);
                    })
                    .catch((e) => {
                        console.error(e);
                        reject(e);
                    });
            });
    });
};
