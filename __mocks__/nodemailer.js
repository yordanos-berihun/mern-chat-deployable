module.exports = {
  createTransport: function () {
    return {
      sendMail: async function (mailOptions) {
        // simple mock: log and resolve
        if (typeof console !== 'undefined') console.log('nodemailer mock sendMail', mailOptions && mailOptions.to);
        return Promise.resolve({ accepted: [], rejected: [] });
      }
    };
  }
};
