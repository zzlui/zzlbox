/**
 * WaitSync class provides synchronization between group of
 * two or more functions which you plan to call asyncronously.
 * @param Function callback The callback function to be executed after 
 *        the group of functions is executed
 * 
 * @version 0.4
 * @example
 * 
 *  var chef = new WaitSync(
 * 		function () {
 * 			alert('Cook noodles');
 *  	}
 *  );
 * 
 *	// son will finish chopping in like 4 seconds
 *  setTimeout(
 * 		chef.wait(function () {
 * 
 * 			// when meat is done
 * 			alert('Meat is ready');
 * 		}),
 * 		
 *  	Math.floor(Math.random()*4000)		
 *  );
 * 
 *  // daughter will finish cutting soon 
 *  setTimeout(
 * 		chef.wait(function () {
 * 
 * 			// prepare vegetables
 * 
 * 			alert('Vegetables are ready');
 * 		}),
 * 		Math.floor(Math.random()*4000)
 *  );
 * 
 *  var soupWithNoodles = false;
 *  if (soupWithNoodles) {
 * 		setTimeout(
 * 			chef.wait(function () {
 * 				alert('Noodles are ready');
 * 			}),
 * 			1000
 * 		);
 *  }
 */
function WaitSync(callback) {
	
	
	var completeCount = 0;
	var flags = {};
	
	// task return values will be stored here
	// and will be passed to callback as argument
	var buffer = {
			'order': [],
			'groupOrder': [],
			'data': {}
		};
	
	/**
	 * Wrap task with callback
	 * @param Function task 
	 * @param Object ctx Context. Object which will be referenced "this"
	 *        inside the task. For those who know the indepths of JS OOP
	 * @return Function
	 */
	var wrapOne = function (task, ctx) {
		// remember in which order did we come in
		var whoAmI = completeCount;
		
		// add count
		completeCount ++;
		var iAmDone = false;
		
		return function () {
			
			// proxy, buffer
			var tmp = task.apply(ctx, arguments);
			
			// log the result
			buffer.order.push(whoAmI);
			
			// just returns result if the same task called twice
			// actually it means your design needs some refactoring
			if (iAmDone) 
				return tmp;
			
			// is it time to call back? :)
			completeCount--;
			
			iAmDone = true;
			
			if (completeCount === 0)
				callback(buffer);
				
			return tmp;
		}
		
	};
	
	/**
	 * Wrap task with potential callback and assign it a certain group.
	 * Several tasks may be grouped.
	 * When task is finished, it's whole group is considered to be done.
	 * It's like... wait for one of the group to be complete.
	 * @param Number/String groupName a name of the group
	 * @param Function task 
	 * @param Object ctx Context. An object which will be referenced "this"
	 *        inside the task
	 * @return Function
	 */
	var wrapGroup = function (groupName, task, ctx) {
		
		// if not created earlier
		if (flags[groupName] !== false) {
			// set task group uncomplete 
			flags[groupName] = false;
			completeCount ++;
		}
		
		// to prevent doubletriggerring (actually not necessary here)
		var iAmDone = false;
		
		return function () {
			var tmp = task.apply(ctx, arguments);
			
			
			// same as in wrap... just return result if called twice 
			if (iAmDone) 
				return tmp;

			// only if group is not done
			if (!flags[groupName]) {
				completeCount--;
				flags[groupName] = true;
			
				// log result:
				buffer.order.push(groupName);
				buffer.groupOrder.push(groupName);
				buffer.data[groupName] = tmp;
				
				// is it time?
				if (completeCount === 0)
					callback(buffer);
			}
			
			return tmp;
		}
	};
	
	
	/**
	 * Wrap "task" with callback. Returns a wrapped function to be used 
	 * instead.
	 * 
	 * @param [optional] String/Number Optional id of the task. 
	 *         A "named" task so to say... 
	 *         Several tasks may have the same id. In this case whenever
	 *         one of them finishes, the whole group is considered to 
	 *         be finished. E.g. ajax success and error callbacks may be
	 *         groupped together so whatever happens, the callback will 
	 *         be fired.
	 * @param Function task Function to be wrapped
	 * @param Object ctx Context. An object which will be referenced "this"
	 *        inside the task
	 * @return Function a wrapped function.
	 */
	this.wrap = function () {
		var call = wrapOne;
		
		if (!(arguments[0] instanceof Function) && (arguments[1] instanceof Function))
			call = wrapGroup;
			
		return call.apply(this, arguments);
	}
}
