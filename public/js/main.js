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
		  })
	},

	initTaskButtons: function() {
		console.log('initTaskButtons');
		$('.btn-task-new').click(function() {
			// Remove any pre-existing new tasks
			$('.template-task-new.temp').remove();

			var $row = $(this).parents('tr');
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
						insertAt: $taskContainer.prevAll().length
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
		});
	},

	initRows: function(rows) {
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			var tr = $("<tr>").attr('data-row-id', row.id)
			var cell1 = $("<th class='row-label plain-bg'>").text(row.label)
			var addBtn = $("<div class='row-buttons'><div class='btn-task-new'>+ Add task</div></div>");
			//var addBtn = $("<div class='row-buttons'><input type='button' class='btn-task-new' value='+ Add task'></div>");
			cell1.append(addBtn);

			// REFACTOR: Extract method to create cell
			var cell2 = $("<td class='task-group plain-bg'>").attr('id',  'row' + row.id + 'col1')
				.attr('data-row-id', row.id).attr('data-col-id', '1')
			var cell3 = $("<td class='task-group plain-bg'>").attr('id',  'row' + row.id + 'col2')
				.attr('data-row-id', row.id).attr('data-col-id', '2')
			var cell4 = $("<td class='task-group plain-bg'>").attr('id',  'row' + row.id + 'col3')
				.attr('data-row-id', row.id).attr('data-col-id', '3')
			var cell5 = $("<td class='task-group plain-bg'>").attr('id',  'row' + row.id + 'col4')
				.attr('data-row-id', row.id).attr('data-col-id', '4')
			
			tr.append(cell1).append(cell2).append(cell3).append(cell4).append(cell5);
			tr.appendTo('.main');
		}
		zenBoard.fetchAndInitTasks();
		zenBoard.initTaskButtons();

		zenBoard.fetchAndInitArchive();
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
			.click(zenBoard.showTaskDetails);
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
			var isArchivedOriginal = (data.is_archived === 1);
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
	    		var insertAt = $task.prevAll().length;

	    		var data = {'id': id, 'rowId': rowId, 'colId': colId, 'insertAt': insertAt};
	    		console.log('drop', data);
		    	socket.emit('task:move', data);
		    } else {
		    	console.log('$task@data-id is falsy', $task);
		    }
		});
	},

	handleError: function(msg, event, data) {
		alert(msg);
		console.log(event, data);
	},

	saveTask: function(taskId, label, description, isArchived, originalData) {
		console.log('saveTask', taskId);
		socket.emit('task:save', {
			'id': taskId, 'label': label, 'description': description, 'isArchived': isArchived, 
			'originalData': originalData, 'timestamp': new Date().getTime()
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

// UI events
$(function() {
	// Init
	zenBoard.fetchAndInitBoard();
});

// Socket.io
$(function() {
	var apiUrl = $('.wb-socketio-config').attr('data-api');
	var boardId = 'metro-dev';

	// var options = {'timeout': 10000, 'reconnectionDelay': 2000, 'reconnectionDelayMax': 10000};
	console.log(apiUrl);
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
		if (data.originalData.isArchived != data.isArchived) {
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
