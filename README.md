# Zenboard: team work made easy

![Zenboard](etc/demo.gif)

Try it out here http://zenbrd.herokuapp.com/

## Why Zenboard?

We believe that your team can achieve something great.

Everyone knows that great work requires lazer focus, deep collaboration and motivation, but until now these things have been a dark art.

Zenboard is a task board that makes it easy.

### Highlights

**1. Collaboration** is easier when tasks can be grouped visually in a row (as popularised by Scrum).

**2. Lazer focus** is easier when there is a roadmap, but in businesses where things constantly change the line between "current work" and "roadmap" is fluid.

With Zenboard you simply drag and drop cards from one row to another.

**3. Motivation** is easier when it's clear what the goal is (and when it's expected to be delivered). Zenboard v1.0 will show both.

### What else?

The key to effective teams is the right people having the right conversations at the right time. Coming soon in v1.1!

## How does Zenboard compare to "product X"?

- Unlike Trello, Zenboard has *rows* as well as columns
- Unlike JIRA, you can drag cards between rows. Zenboard is a *pleasure* to use, not a pain.

## Status

Zenboard is still v0.1 - expect bugs, instability and missing functionality. We hope to release v1.0 by the end of 2017.

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

7. Initialise the schema: connect to the database and run sql.txt

8. Deploy Zenboard to Heroku: `git push heroku master`

9. Launch Zenboard in a browser: `heroku open`

### More info
Heroku's guide to working with Node.js [here](https://devcenter.heroku.com/articles/getting-started-with-nodejs#deploy-the-app).

### To host Zenboard elsewhere

All you need is MySQL and a server supporting Node.js

In most cases:
- there will be relatively few requests per minute so minimal server resources will be needed
- high availability / clustering / load balancing won't be needed

## Explore

If you want to explore the source for the Vue.js frontend... [it's here](https://github.com/matthumphreys/zenboard-vue).

## Contribute

Want to get involved? Get in touch!

## What about "feature X"?

### Mobile app

Columns aren't a good fit for mobile. We have a very different design for mobile but that's a story for another day ;)

### Auth, SaaS, etc

To develop this Zenboard needs a contributor or sponsor.

### Estimating TODO

### Reporting TODO
