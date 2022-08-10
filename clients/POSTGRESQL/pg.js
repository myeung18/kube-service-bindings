// Binding for pg client
module.exports = {
  mapping: {
    username: 'user',
    host: 'host',
    database: 'database',
    password: 'password',
    port: 'port',
    'ca.crt': { ssl: 'ca' },
    'tls.key': { ssl: 'key' },
    'tls.crt': { ssl: 'cert' },
    'root.crt': { ssl: 'ca' }
  },
  transform: (binding) => {
    const opt = buildOptionParam(binding);
    if (opt) {
      binding.options = opt;
    }
  }
};

function buildOptionParam(binding) {
  const buildOptions = (optParams) => {
    // expected raw options format: key1=val1&key2=val2...
    let crdbOpt;
    const optList = [];
    optParams.forEach(function (item) {
      const opt = item.split('=');
      if (opt.length !== 2 || opt[0].length === 0 || opt[1].length === 0) {
        return;
      }
      if (opt[0] === '--cluster') {
        crdbOpt = opt[0] + '=' + opt[1];
      } else {
        // e.g.: -c opt=val
        optList.push('-c ' + opt[0] + '=' + opt[1]);
      }
    });
    let opt = crdbOpt;
    if (optList.length > 0) {
      const otherOpt = optList.join(' '); // join with space
      if (opt) {
        opt = opt + ' ' + otherOpt;
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
