/** 
 * Enables models to refresh board.
 */
const debug = require('debug')('zenboard:events');

class EventsUtil {

  static emitBoardRefreshWithRows(io, rows) {
    let board = {rows: rows};
    EventsUtil.emitBoardRefresh(io, board);
  }

  static emitBoardRefresh(io, board) {
    debug("About to emit boardRefresh");
    io.emit('boardRefresh', board);
  }

}

module.exports = EventsUtil;