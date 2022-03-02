const { App, LogLevel } = require('@slack/bolt');
const OAuth = require('./model/oauth');

const app = new App({
  signingSecret: process.env.SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: ['commands'],
  installationStore: {
    storeInstallation: async (installation) => {
      let _id;
      if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
        _id = installation.enterprise.id;
      } else if (installation.team !== undefined) {
        _id = installation.team.id;
      } else {
        throw new Error('Failed saving installation data to installationStore');
      }
      await OAuth.findByIdAndDelete(_id).exec();
      const install = new OAuth({_id, installation});
      return install.save();
    },
    fetchInstallation: async (installQuery) => {
      let _id;
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        _id = installQuery.enterpriseId;
      } else if (installQuery.teamId !== undefined) {
        _id = installQuery.teamId;
      } 
      const result = await OAuth.findById(_id).exec();
      if (result) {
        return result.installation;
      }
      throw new Error('Failed fetching installation');
    },
    deleteInstallation: async (installQuery) => {
      let _id;
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        _id = installQuery.enterpriseId;
      } else if (installQuery.teamId !== undefined) {
        _id = installQuery.teamId;
      }
      await OAuth.findByIdAndDelete(_id).exec();
    }
  },
  installerOptions: {
    directInstall: true,
    callbackOptions: {
      success: (installation, options, callbackReq, callbackRes) => {
        callbackRes.write('Success. Please return back to Slack to use the app.\n');
        callbackRes.end();
      },
      failure: (error, options, callbackReq, callbackRes) => {
        callbackRes.write('failure\n');
        callbackRes.end();
      }
    }
  },
  logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
});

module.exports = app;
