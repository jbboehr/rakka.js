
define(['jquery'], function($) {

	function onChange(event) {
		if( event && ((event.keyCode >= 38 && event.keyCode <= 40) || event.keyCode == 13) ) {
			return;
		}
		var text = this.$input.val();
		this.$list.empty();
		this.listItems = [];
		this.currentData = [];
		this.index = 0;
		for( var x in this.data ) {
			var datum = this.data[x];
			if( !text && !datum.show_empty ) {
				continue;
			}
			if( text && datum.title.toLowerCase().indexOf(text.toLowerCase()) === -1 ) {
				continue;
			}
			this.currentData.push(datum);
			var listItem = $('<li>').appendTo(this.$list);
			$('<a>')
				.attr('data-id', datum.id)
				.attr('data-index', this.listItems.length)
				.text(datum.title)
				.appendTo(listItem);
			this.listItems.push(listItem);
		}
	}
	
	function onFocus(event) {
		if( !this.listItems.length ) {
			onChange.call(this, event);
		}
	};
	
	function onKeyDown(event) {
		var active = this.$list.find('.active');
		active.removeClass('active');
		
		if( event.keyCode == 38 ) { // up
			event.preventDefault();
			this.index -= 1;
			if( this.index < 0 ) {
				this.index += this.currentData.length;
			}
		} else if( event.keyCode === 40 ) { // down
			event.preventDefault();
			if( !active.length ) {
				this.index = 0;
			} else {
				this.index = (this.index + 1) % this.currentData.length;
			}
		} else if( event.keyCode === 13 ) { // enter
			event.preventDefault();
			if( this.currentData.length > 0 ) {
				selectItem.call(this, this.index);
			} else if( this.options.allowArbitrary ) {
				selectItem.call(this, this.$input.val());
			}
			return;
		} else {
			return;
		}
		this.listItems[this.index].addClass('active');
	};
	
	function onListClick(event) {
		var el = $(event.target);
		if( el.is('li') ) {
			el = el.find('a');
		}
		if( !el.is('a') ) {
			return;
		}
		var index = parseInt(el.attr('data-index'));
		selectItem.call(this, index);
	}
	
	function onDismiss(event) {
		$(event.target).parent().remove();
		this.$input.val('').show();
		this.$list.show();
		setTimeout(function() {
			this.$input[0].focus();
			onChange.call(this, event);
		}.bind(this), 20);
	}
	
	function selectItem(index) {
		var label = '' + (typeof index === 'string' ? index : this.currentData[index].title);
		var id = '' + (typeof index === 'string' ? index : this.currentData[index].id);
		var resultLabel = $('<div class="form-control">').text(label);
		resultLabel.insertAfter(this.$input);
		resultLabel.append($('<a class="close" data-dismiss="suggest">&times;</a>').on('click', onDismiss.bind(this)));
		this.$input.val(id);
		this.$input.hide();
		this.$list.hide();
	}
	
	function ultraSimpleAutosuggest(textElement, data, options) {
		textElement = $(textElement);
		textElement.addClass('ultra-simple-suggest');
		
		var context = {};
		context.options = (options || {});
		context.data = data;
		context.index = 0;
		context.listItems = [];
		context.currentData = [];
		
		context.$input = textElement;
		context.$container = $('<div class="ultra-simple-suggest"><ul></ul></div>').insertAfter(textElement);
		context.$list = context.$container.find('ul');
		
		context.$list.on('click', onListClick.bind(context));
		context.$input.on('focus', onFocus.bind(context));
		context.$input.on('keyup', onChange.bind(context));
		context.$input.on('keydown', onKeyDown.bind(context));
		
		onChange.call(context);
		
		return context;
	}
	
	return ultraSimpleAutosuggest;
});
