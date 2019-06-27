const jwt = require('jsonwebtoken');
const fs = require('fs');
const axios = require('axios');

const getInstallationToken = async (appId, key, organization, repository) => {
  const signOptions = {
    iss: appId,
    iat: Math.floor(new Date().getTime() / 1000) - 60,
    exp: Math.floor(new Date().getTime() / 1000) + 10 * 60
  };

  const token = jwt.sign(signOptions, key, { algorithm: 'RS256' });

  return axios.get(`https://api.github.com/repos/${organization}/${repository}/installation`, getHeaders(token))
    .then(res => res.data.id)
    .then(installationId => axios.post(`https://api.github.com/app/installations/${installationId}/access_tokens`, {}, getHeaders(token)))
    .then(res => res.data.token);
};

const getHeaders = token => ({
  headers: {
    authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.machine-man-preview+json'
  }
});

module.exports.templateTags = [{
  name: 'githubJwtCreate',
  displayName: 'Github JWT Creator',
  description: 'Generate Github JWT for developer apps',
  args: [{
    displayName: 'Private Key Location',
    description: 'Unqualified location of your Github developer app private key',
    type: 'string',
    defaultValue: ''
  },
  {
    displayName: 'Developer App ID',
    description: 'Found in the URL of your app',
    type: 'string',
    defaultValue: ''
  },
  {
    displayName: 'Organization',
    description: 'Github project organization or user',
    type: 'string',
    defaultValue: ''
  },
  {
    displayName: 'Repository',
    description: 'Github repository name',
    type: 'string',
    defaultValue: '',
  }],
  async run(_context, keyLocation, appId, org, repo) {
    const githubKey = fs.readFileSync(keyLocation);
    return await getInstallationToken(appId, githubKey.toString(), org, repo)
  }
}];
