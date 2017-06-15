const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const compose = require('composition');
const url = require('url');

module.exports = force['default'] = force;

function force(compiler, opts) {
  opts = opts || {};

  let config;
  if (compiler.compilers) {
    // 若为multicompilers则取第一个publicPath
    config = compiler.compilers[0].options;
  } else {
    config = compiler.options;
  }

  const publicPath = opts.publicPath || config.output.publicPath || '/';
  const hotMiddleware = webpackHotMiddleware(compiler, {
    heartbeat: 6000
  });
  const devMiddleware = webpackDevMiddleware(
    compiler,
    Object.assign(
      {
        publicPath: publicPath,
      },
      opts
    )
  );
  const fs = devMiddleware.fileSystem;

  const middlewares = compose([fileList, dev, hot]);
  middlewares.fs = fs;

  return middlewares;

  function* fileList(next) {
    if (this.path.indexOf('/__dev-server') === 0) {
      this.type = 'text/html';
      const body = [];

      function traverseDirectory(baseUrl, basePath) {
        const content = fs.readdirSync(basePath);
        body.push('<ul>');
        content.forEach(item => {
          const p = `${basePath}/${item}`;
          if (fs.statSync(p).isFile()) {
            body.push(`
              <li>
                <a href="${url.resolve(baseUrl, item)}">${item}</a>
              </li>
            `);
          } else {
            body.push(`
              <li>
                ${item}<br />
            `);
            traverseDirectory(`${url.resolve(baseUrl, item)}/`, p);
            body.push('</li>');
          }
        });
        body.push('</ul>');
      }

      traverseDirectory(publicPath, '/');

      this.body = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
          </head>
          <body>
            ${body.join('')}
          </body>
        </html>
      `;
      return;
    }
    yield next;
  }

  function* dev(next) {
    yield new Promise(resolve => {
      devMiddleware(
        this.req,
        {
          end: content => {
            this.body = content;
            resolve();
          },
          setHeader: (name, value) => {
            this.set(name, value);
          },
        },
        () => {
          resolve(next);
        }
      );
    });
  }

  function* hot(next) {
    yield new Promise(resolve => {
      hotMiddleware(this.req, this.res, () => {
        resolve(next);
      });
    });
  }
}
