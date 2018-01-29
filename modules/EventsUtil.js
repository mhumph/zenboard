/** 
 * Enables models to refresh board.
 */
const debug = require('debug')('zenboard:events');

class EventsUtil {

  static emitBoardRefresh(io, board) {
    debug("About to emit boardRefresh");
    io.emit('boardRefresh', board);
  }

  static emitBoardRefreshWithRows(io, rows) {
    let board = {rows: rows};
    EventsUtil.emitBoardRefresh(io, board);
  }

}

module.exports = EventsUtil;