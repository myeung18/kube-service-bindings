const { filterObject } = require('../../utils/index.js');

// Binding for pg cockroach DB client
// https://www.postgresql.org/docs/13/libpq-connect.html (connection string)
// urlexample := "postgres://username:password@localhost:5432/database_name"
// e.g.:
// postgresql://
// postgresql://localhost
// postgresql://localhost:5433
// postgresql://localhost/mydb
// postgresql://user@localhost
// postgresql://user:secret@localhost
// postgresql://other@localhost/otherdb?connect_timeout=10&application_name=myapp
// postgresql://host1:123,host2:456/somedb?target_session_attrs=any&application_name=myapp


module.exports = {
  mapping: {
    username: 'user',
    host: 'host',
    database: 'database',
    password: 'password',
    options: 'options',
    sslmode: 'sslmode',
    port: 'port',
    'root.crt': { key: 'rootcrt', path: true }
  },
  transform: (binding) => {
    let url = 'postgresql://';
    let un = encodeURIComponent(binding.user);
    const pwd = encodeURIComponent(binding.password);
    if (un) {
      if (pwd) {
        un += ':' + pwd;
      }
      un += '@';
    }
    url += un + binding.host;
    if (binding.port) {
      url += ':' + binding.port;
    }
    if (binding.database) {
      url += '/' + binding.database;
    }

    const parts = [];
    const addToPart = (k, v) => {
      parts.push(k + '=' + v);
    };
    // One-way TLS (PostgreSQL certifies itself)
    if (binding.sslmode) {
      addToPart('sslmode', binding.sslmode);
    }
    binding.sslrootcert = binding.rootcrt;
    if (binding.sslrootcert) {
      addToPart('sslrootcert', binding.sslrootcert);
    }

    const opt = buildOptionParam(binding);
    if (opt) {
      addToPart('options', opt);
    }

    if (parts.length > 0) {
      let slash = '';
      if (!binding.database) {
        slash = '/';
      }
      url += slash + '?' + parts.join('&');
    }
    binding.connectionString = url;
  },
  filter: (binding) => filterObject(binding, ['connectionString'])
};

function buildOptionParam(binding) {
  const buildOptions = (optParams) => {
    let crdbOpt;
    const optList = [];
    optParams.forEach(function (item) {
      const opt = item.split('=');
      if (opt.length !== 2 || opt[0].length === 0 || opt[1].length === 0) {
        return;
      }
      if (opt[0] === '--cluster') {
        crdbOpt = encodeURIComponent(opt[0] + '=' + opt[1]);
      } else {
        // e.g.: -c opt=val
        optList.push(encodeURIComponent('-c ' + opt[0]) + '=' + opt[1]);
      }
    });
    let opt = crdbOpt;
    if (optList.length > 0) {
      const otherOpt = optList.join('%20'); // join with space
      if (opt) {
        opt = opt + '%20' + otherOpt;
      } else {
        opt = otherOpt;
      }
    }
    return opt;
  };

  let optionStr;
  if (binding.options) {
    optionStr = buildOptions(binding.options.split('&'));
  }
  return optionStr;
}
