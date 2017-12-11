# Zenboard: team work made easy

![Zenboard](etc/demo.gif)

Try it out here http://zenbrd.herokuapp.com/

## Why Zenboard?

We believe that your team can achieve something great.

Everyone knows that great work requires lazer focus, deep collaboration and motivation, but until now these things have been a dark art.

Zenboard is a task board that makes it easy.

### Secret sauce

**1. Collaboration** is easier when tasks can be grouped visually in a row (as popularised by Scrum).

**2. Lazer focus** is easier when there is a roadmap, but roadmaps are fluid. Zenboard embraces this - you simply drag and drop cards from one row to another.

**3. Motivation** is easier when it's clear what the goal is (and when it's expected to be delivered). Zenboard v1.0 will show both.

### What else?

The key to effective teams is the right people having the right conversations at the right time. Coming soon in v1.1!

## How does Zenboard compare to "product X"?

- Unlike Trello, Zenboard has *rows* as well as columns.
- Unlike JIRA, you can drag cards between rows.
- Unlike JIRA, Zenboard is a *pleasure* to use, not a pain.

## Status

Zenboard is currently v0.1 - expect bugs, instability and missing functionality. We hope to release v1.0 by the end of 2017 :)

## Create your own board in 10 minutes

Zenboard is lightweight - suitable for hosting on a free Heroku account.
(If you want to host elsewhere check [this guide](#to-host-zenboard-elsewhere)).

1. You will need Git installed locally
https://git-scm.com/downloads

2. Clone the Zenboard repo
```
git clone https://github.com/matthumphreys/zenboard.git
cd zenboard
```

3. [Signup for a Heroku account](https://signup.heroku.com/)

4. [Install the Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

5. Make sure you've logged in to Heroku CLI and created the app
```
heroku login
heroku create
```

6. Provision JawsDB (MySQL): `heroku addons:create jawsdb`

7. Deploy Zenboard to Heroku: `git push heroku master`

8. Open Zenboard in a browser: `heroku open`

### More info
Heroku's "getting started" guide for Node.js [here](https://devcenter.heroku.com/articles/getting-started-with-nodejs#deploy-the-app).

### To host Zenboard elsewhere

All you need is MySQL and a server supporting Node.js. In most cases:
- minimal server resources will be needed, as there will be relatively few requests per minute
- high availability / clustering / load balancing won't be needed

NOTE: If the app doesn't find the necessary MySQL tables, then it will automatically create them. The schema to contain them must already exist though - see config/db-config.js

## Share the love

If you like Zenboard please GitHub star it, thanks!

## About

Zenboard uses Vue.js, Node.js and socket.io

The Vue.js source is in a separate repo [here](https://github.com/matthumphreys/zenboard-vue).

## Contribute

Want to get involved? Get in touch!

## What about "feature X"?

### Mobile app

Task board columns aren't a good fit for mobile. We have a very different design for mobile but that's a story for another day ;)

### Auth, SaaS, etc

To develop auth/SaaS, Zenboard will need a contributor or sponsor.

### Estimating, "sprint velocity", etc

Zenboard isn't planning specific features for task estimating or velocity reports.

To find out why, watch [this video on Modern Agile](https://www.agilealliance.org/resources/videos/modern-agile/).

<img src="http://modernagile.org/img/modern_agile_wheel.svg" alt="Modern Agile" width="300" />
