const isLocalDataMode = () => (process.env.DATA_MODE || '').toLowerCase() === 'local';

module.exports = { isLocalDataMode };
