# Zenboard: team work made easy

![Demo](etc/demo.gif)

## 1. Try the demo!

http://zenbrd.herokuapp.com/

## 2. Create your own board in 10 minutes

Zenboard is lightweight - suitable for hosting on a free Heroku account.
(Jump [here](#) if you want to host elsewhere).

1. You will need Git installed locally
https://git-scm.com/downloads

2. Clone the Zenboard repo
```
git clone https://github.com/matthumphreys/zenboard.git
cd zenboard
```

3. Signup for a Heroku account https://signup.heroku.com/

4. Install the Heroku CLI
https://devcenter.heroku.com/articles/heroku-cli

5. Provision JawsDB (MySQL): `heroku addons:create jawsdb`

6. Deploy Zenboard to Heroku
https://devcenter.heroku.com/articles/getting-started-with-nodejs#deploy-the-app

### Hosting elsewhere

All you need to host Zenboard is MySQL and a server supporting Node.js.

In most cases:
- there will be relatively few requests per minute so minimal server resources will be needed
- high availability / clustering / load balancing isn't needed


## 3. Contribute

Want to get involved? Get in touch!
