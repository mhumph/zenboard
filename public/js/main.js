var socket;

var zenBoard = {

	getApiBaseUrl: function() {
		return $('.wb-socketio-config').attr('data-api') + 'api/';
	},

	fetchAndInitBoard: function() {
		var jqxhr = $.ajax( zenBoard.getApiBaseUrl() + 'rows/' )
		  .done(function(data, textStatus) {
		  	console.log('fetchAndInitBoard');
		    zenBoard.initRows(data);
		  })
		  .fail(function(jqXHR, textStatus) {
		    alert("Error fetching board");
		  });
	},

	initRows: function(rows) {
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			var tr = zenBoard.initRow(row);
			tr.appendTo('.main');
		}
		zenBoard.fetchAndInitTasks();
		$('.action-task-new').click(zenBoard.newTaskHandler);
	},

	initRow: function(row) {
		var tr = $("<tr class='row'>").attr('data-row-id', row.id);
		var label = $("<span class='row-label'>").text(row.label).click(function() {
			zenBoard.fetchAndShowRowDetails(this);
		});
		var cell1 = $("<th class='row-heading plain-bg'>").append(label);
		var addBtn = $("<div class='row-buttons'><div class='btn-task-new action-task-new'>+ Add task</div></div>").hide();
		//var addBtn = $("<div class='row-buttons'><input type='button' class='btn-task-new action-task-new' value='+ Add task'></div>");
		cell1.append(addBtn);
		var cell2 = zenBoard.initCell(row, 1);
		var cell3 = zenBoard.initCell(row, 2);
		var cell4 = zenBoard.initCell(row, 3);
		var cell5 = zenBoard.initCell(row, 4);
		
		tr.append(cell1).append(cell2).append(cell3).append(cell4).append(cell5);
		tr.hover(
			function() {$(this).find('.row-buttons').show();},
			function() {$(this).find('.row-buttons').hide();}
		); 
		return tr;
	},

	initCell: function(row, colNumber) {
		return $("<td class='task-group plain-bg'>")
			.attr('id',  'row' + row.id + 'col' + colNumber)
			.attr('data-row-id', row.id).attr('data-col-id', '' + colNumber);
	},

	fetchAndInitTasks: function(rowId) {
		var jqxhr = $.ajax( zenBoard.getApiBaseUrl() + 'tasks/')
		.done(function(data, textStatus) {
	  		console.log('fetchAndInitTasks');
	    	zenBoard.initTasks(data);
	  	})
	  	.fail(function(jqXHR, textStatus) {
	    	alert("Sorry, there was a problem initialising the board");
	  	})
	},

	initTasks: function(tasks) {
		for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			var id = '#row' + task.row_id + 'col' + task.col_id;
			zenBoard.createTaskElement(task).appendTo(id);
		}
		zenBoard.initDragula();
	},

	createTaskElement: function(task) {
		return $("<div class='task'>").text(task.label)
			.attr('data-id', task.id)
			.attr('data-order', task.my_order)
			.attr('title', 'id ' + task.id)
			.click(zenBoard.showTaskDetails);
	},

	newTaskHandler: function() {
		console.log('newTaskHandler');
		// Remove any pre-existing new tasks
		$('.template-task-new.temp').remove();

		var $row = $(this).parents('tr')
		if (!$row.length) {
			// Probs clicked "Add task" in the masthead navigation. Default to first row.
			$row = $('table.main tr.row').first();
		}
		console.log("$row", $row);
		var $target = $row.find("td[data-col-id='1']");
		var $template = $('#hidden-templates .template-task-new').clone();
		$target.append($template);
		$template.addClass('temp').show();
		$template.children('[contenteditable]').get(0).focus();

		function save($taskContainer) {
			//var $taskContainer = $(that).parents('.template-task-new');
			var label = $taskContainer.find('.task-new').text();
			if (label) {
				var $cell = $taskContainer.parents('td');
				var rowId = $cell.attr('data-row-id');
				var colId = $cell.attr('data-col-id');

				var data = {
					rowId: rowId,
					colId: colId,
					label: label,
					myOrder: $taskContainer.prevAll().length + 1
				}
				socket.emit('task:create', data);
			} else {
				$template.remove();
			}
		}

		$template.find('.btn-cancel').click(function() {
			$template.remove();
		});
		$template.find('.btn-save').click(function() {
			$taskContainer = $(this).parents('.template-task-new');
			save($taskContainer);
		});

		// Keyboard shortcuts
	  	$template.keydown(function(event) {
	  		// (CTRL or CMD) + Enter
	  		if ((event.ctrlKey || event.metaKey) && event.which === 13) {
	            save($(this));
	            return false;
	        }
	        if (event.which === 27) { // Escape
	            $template.remove();
	        }
	  	});
	},

	showTaskDetails: function() {
		var $template = $('.template-task-details');
		$template.hide();
		var taskId = $(this).attr('data-id');
		console.log('showTaskDetails', taskId);

		var jqxhr = $.ajax(zenBoard.getApiBaseUrl() + 'tasks/' + taskId)
		.done(function(data, textStatus) {
			var description = (data.description) ? data.description : '';
			var $description = $template.find('.tdc-description');
			var $label = $template.find('.tdc-label');
			var $archive = $template.find('input.tdc-archive');
			var $content = $template.find('.task-details-content');

			$template.data('data-id', taskId);
			$label.val(data.label);
			$description.val(description);
			$archive.prop('checked', (data.is_archived === 1));

			$template.show();
			$description.get(0).focus();

			// TODO: Save draft data against DOM

			function save() {
				var saveId = $('.template-task-details').data('data-id');
				var isArchived = ($archive.prop('checked') === true);
		  		zenBoard.saveTask(saveId, $label.val(), $description.val(), isArchived, data);
			}

			$('.tdc-button-save').off().click(function() {
				console.log('Save button was clicked');
				save();
		  	});

			// Clicking outside the details box should close it
		  	$template.off().click(function(e) {
		  		if (!$content.is(e.target) && $content.has(e.target).length === 0) {
		  			$template.hide();
		  		}
		  	});

		  	// Keyboard shortcuts
		  	$template.keydown(function(event) {
		  		// (CTRL or CMD) + Enter
		  		if ((event.ctrlKey || event.metaKey) && event.which === 13) {
		            save();
		            return false;
		        }
		        if (event.which === 27) { // Escape
		            $template.hide();
		        }
		  	});
	  	})
	  	.fail(function(jqXHR, textStatus) {
	    	alert("Sorry, there was a problem getting the task details");
	  	})
	  	$('.tdc-button-cancel').click(function() {
	  		$template.hide();
	  	});
	  	$('.tdc-button-archive').click(function() {
	  		console.log('archive');
	  		alert("Archiving feature coming soon!");
	  	});
	},

	saveTask: function(taskId, label, description, isArchived, originalData) {
		console.log('saveTask', taskId);
		socket.emit('task:save', {
			'id': taskId, 'label': label, 'description': description, 'isArchived': isArchived, 
			'originalData': originalData, 'timestamp': new Date().getTime()
		});
	},

	/* HELPERS ***************************************************************/

	handleFormKeys: function(event, saveFunc, $elemToHide) {
		// (CTRL or CMD) + Enter
  		if ((event.ctrlKey || event.metaKey) && event.which === 13) {
            saveFunc();
            return false;
        }
        if (event.which === 27) { // Escape
            $elemToHide.hide();
        }
    },

	handleClickOutside: function(e, $template, $content) {
		if (!$content.is(e.target) && $content.has(e.target).length === 0) {
  			$template.hide();
  		}
	},

	handleError: function(msg, event, data) {
		alert(msg);
		console.log(event, data);
	},

	/* DRAG AND DROP *********************************************************/

	initDragula: function() {
		var containers = [];
        var nodeList = document.querySelectorAll('.task-group');
        for (var i = 0; i < nodeList.length; ++i) {
            containers.push(nodeList[i]);
        }
        dragula(containers, {revertOnSpill: true})
    	.on('drop', function (draggedEl, dropTargetEl) {
    		var $task = $(draggedEl);
    		var id = $task.attr('data-id');
    		if (id) {
	    		var $cell = $(dropTargetEl);
	    		var rowId = $cell.attr('data-row-id');
	    		var colId = $cell.attr('data-col-id');
	    		var myOrder = $task.prevAll().length + 1;
	    		var insertAfterId = $task.prev('.task').attr('data-id');

	    		var data = {'id': id, 'rowId': rowId, 'colId': colId, 'myOrder': myOrder, 'ui_insertAfterId': insertAfterId};
	    		console.log('drop', data);
		    	socket.emit('task:move', data);
		    } else {
		    	console.log('$task@data-id is falsy', $task);
		    }
		});
	},

	/* MAIN NAV **************************************************************/

	initMainNav: function() {
		$('.nav-row-new').click(function() {
			zenBoard.showNewRowDetails(true);
		});

		$('.nav-task-new').click(zenBoard.newTaskHandler);
	},

	/* ROW FORM **************************************************************/

	showNewRowDetails: function() {
		var $template = $('.template-row-details');
		$template.hide();
		$template.find('.form-title').show();
		$template.find('.trc-label').val('');
		$template.find('.trc-info').val('');
		zenBoard.showRowDetails({'my_order': 1000000});
	},

	fetchAndShowRowDetails: function(source) {
		var $template = $('.template-row-details');
		$template.hide();
		var rowId = $(source).parents('tr').first().attr('data-row-id');

		var jqxhr = $.ajax(zenBoard.getApiBaseUrl() + 'rows/' + rowId)
		.done(function(data, textStatus) {
			var $template = $('.template-row-details');
			var $label = $template.find('.trc-label');
			var $info = $template.find('.trc-info');

			$template.find('.form-title').hide();
			$template.attr('data-id', data.id);
			$label.val(data.label);
			$info.val(data.info);
			zenBoard.showRowDetails(data);
		})
		.fail(function(jqXHR, textStatus) {
	    	alert("Sorry, there was a problem getting the row details");
	  	});
	},

	populatePositionDropdown: function($myOrder, my_order) {
		var jqxhr = $.ajax(zenBoard.getApiBaseUrl() + 'rows/')
		.done(function(data, textStatus) {
			var OFFSET = 1;	// +1 for 'top'
			$myOrder.children('option').remove();
			$myOrder.append("<option value='1'>1 (top)</option>");

			// Zero is just labelled "Top", so we can start at 1
			for (var i = 1; (i < data.length); i++) {
				var ordinal = i + OFFSET;
				var $option = $('<option>').attr('value', ordinal);

				if (ordinal < my_order) {
					var prevRow = data[i - 1];
					$option.text('' + ordinal + " (after " + prevRow.label + ")");
					$option.appendTo($myOrder);
				}
				if (ordinal == my_order) {
					$option.text('' + ordinal + " (current)");
					$option.prop('selected', 'selected');
					$option.appendTo($myOrder);
				}
				if (ordinal > my_order) {
					var prevRow = data[i];
					$option.text('' + ordinal + " (after " + prevRow.label + ")");
					$option.appendTo($myOrder);
				}
			}
		})
		.fail(function(jqXHR, textStatus) {
			console.log('ERROR populating position dropdown');
	  	});
	},

	/** @param originalRowData SQL result */
	showRowDetails: function(originalRowData) {
		var $template = $('.template-row-details');
		var $myOrder = $template.find('.trc-position select');
		this.populatePositionDropdown($myOrder, originalRowData.my_order);
		$template.show();
		$('.trc-label').get(0).focus();

		function save() {
			var saveId = $template.attr('data-id');
			var $label = $template.find('.trc-label');
			var $info = $template.find('.trc-info');
	  		zenBoard.saveRow(saveId, $label.val(), $myOrder.val(), $info.val(), originalRowData);
		}

		$template.find('.modal-cancel').click(function() {
			$template.hide();
		});

		$('.trc-button-save').off().click(save);

		// Clicking outside the details box should close it
	  	$template.off().click(function(event) {
	  		zenBoard.handleClickOutside(event, $template, $('.row-details-content'));
	  	});

	  	// Keyboard shortcuts
	  	$template.keydown(function(event) {
	  		zenBoard.handleFormKeys(event, save, $template);
	  	});
	},

	saveRow: function(rowId, label, myOrder, info, originalData) {
		console.log('saveRow', rowId);
		socket.emit('row:save', {
			'id': rowId, 'label': label, 'myOrder': myOrder, 
			'info': info, 'originalData': originalData
		});
	},

	/* ARCHIVE ***************************************************************/

	fetchAndInitArchive: function() {
		var jqxhr = $.ajax( zenBoard.getApiBaseUrl() + 'archive/tasks' )
		  .done(function(data, textStatus) {
		  	console.log('fetchAndInitArchive');
		    zenBoard.initArchive(data);
		  })
		  .fail(function(jqXHR, textStatus) {
		    alert("Error fetching archive");
		  })
	},

	initArchive: function(archivedTasks) {
		$('.archived-tasks-content').html('');
		for (var i = 0; i < archivedTasks.length; i++) {
			var item = archivedTasks[i];
			var $item = $("<div class='archived-task'>").attr('data-id', item.id).text(item.label);
			// REFACTOR: <br> hack... try this instead https://stackoverflow.com/a/451076/1454618
			$item.click(zenBoard.showTaskDetails)
			$item.appendTo('.archived-tasks-content').after('<br>');
		}
	},
}

$(function() {
	// Init
	zenBoard.fetchAndInitBoard();
	zenBoard.initMainNav();
	zenBoard.fetchAndInitArchive();
});

// Socket.io
$(function() {
	var apiUrl = $('.wb-socketio-config').attr('data-api');
	var boardId = 'metro-dev';
	socket = io(apiUrl);

	function addTask(data) {
		console.log(data);
		if (data.rowId && data.colId) {
			var $newTask = zenBoard.createTaskElement(data);
			$cell = $('#row' + data.rowId + 'col' + data.colId);
			$cell.find('.template-task-new').replaceWith($newTask);
		} else {
			console.log("Warning! rowId or colId invalid");
		}
	}

	socket.on('task:create:success', function(data) {
		addTask(data);
	});

	socket.on('task:save:success', function(data) {
		console.log('task:save:success', data);

		var $task = $(".task[data-id='" + data.id + "']");
		$task.text(data.label);
		$('.template-task-details').hide();

		// If archived status has changed
		if (data.isArchived != (data.originalData.is_archived === 1)) {
			zenBoard.fetchAndInitArchive();
			if (data.isArchived === true) {
				$task.remove();
			} else {
				var $newTask = zenBoard.createTaskElement(data);
				$cell = $('#row' + data.originalData.row_id + 'col' + data.originalData.col_id);
				console.log(data);
				$cell.append($newTask);
			}
		}
	});

	socket.on('row:save:success', function(data) {
		console.log('row:save:success', data);
		$('.template-row-details').hide();
		var $row;

		if (data.originalData.id) {
			// Existing row
			$row = $("tr[data-row-id='" + data.id + "']");
			// Update label
			$row.find('.row-label').text(data.label);

			if (data.myOrder != data.originalData.my_order) {
				// Move row: remove it before re-inserting in the new position
				$row.remove();
			}
		} else {
			$row = zenBoard.initRow(data);
			console.log('$row', $row.html());
		}
		var nToInsertBefore = parseInt(data.myOrder) + 1;	// 1st row is header row
		$row.insertBefore('table.main tr:nth-of-type(' + nToInsertBefore + ')');
	});

	/* CHANGES FROM OTHER USERS **********************************************/

	socket.on('task:move:sync', function(data) {
		console.log('move:sync', data);
		$task = $(".task[data-id=" + data.id + "]").remove();
		if (data.ui_insertAfterId) {
			// ?REFACTOR: might be better to use ".task:nth-of-type(" + data.myOrder + ")"
			$prevTask = $(".task[data-id=" + data.ui_insertAfterId + "]");
			$task.insertAfter($prevTask);	
		} else {
			$cell = $('#row' + data.rowId + 'col' + data.colId);
			$task.prependTo($cell);
		}
	});

	/* ERRORS ****************************************************************/

	socket.on('task:create:error', function(data) {
		zenBoard.handleError("Sorry, there was an error saving the task", 'task:create:error', data);
	});

	socket.on('task:save:error', function(data) {
		zenBoard.handleError("Sorry, there was an error saving the task", 'task:save:error', data);
	});

	socket.on('task:move:error', function(data) {
		zenBoard.handleError("Sorry, there was an error saving the task", 'task:move:error', data);
	});

	socket.on('cell:update:error', function(data) {
		zenBoard.handleError("Sorry, there was an error updating the order of the tasks", 'cell:update:error', data);
	});
	
});
