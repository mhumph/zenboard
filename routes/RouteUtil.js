/** @file Functions used by multiple routes. */
'use strict';

class RouteUtil {

  static sendArray(response, result, error) {
    if (error) {
      RouteUtil.sendError(response, error);
    } else {
      response.send(result);
    }
  }

  static sendObject(response, result, error) {
    if (error) {
      RouteUtil.sendError(response, error);
    } else {
      let resultToSend = (result.length >= 1) ? result[0] : {};
      response.send(resultToSend);
    }
  }

  /** Send 500 Internal Server Error */
  static sendError(response, error, msg) {
    if (msg) {
      console.error(msg, error);
    } else {
      console.error(error);
    }
    response.status(500).send(error);
  }

}

module.exports = RouteUtil;