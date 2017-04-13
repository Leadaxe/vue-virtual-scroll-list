import Vue from 'vue';
import draggable from 'vuedraggable'

const VirtualList = Vue.component('vue-virtual-scroll-list', {
  components: {draggable},
	props: {
		size: {
			type: Number,
			required: true
		},
		remain: {
			type: Number,
			required: true
		},
		klass: {
			type: String,
			default: 'virtual-scroll-list'
		},
    items: {
			type: Array
		},
		onScroll: Function
	},

	// an object helping to calculate
	delta: {
		start: 0, // start index
		end: 0, // end index
		total: 0, // all items count
		keeps: 0, // nums of item keeping in real dom
		viewHeight: 0, // container wrapper viewport height
		allPadding: 0, // all padding of not-render-yet doms
		paddingTop: 0, // container wrapper real padding-top
	},

	data () {
    return {
    	isDragded: false,
			lastScrollTop: 0
    }
	},

	methods: {
		handleScroll (e) {
			if (this.isDragded){
				return;
			}
			this.countScrollTop();
			if (this.onScroll) {
				this.onScroll(e, scrollTop);
			}
		},

		countScrollTop() {
			let scrollTop = this.$refs.container.scrollTop;
			this.lastScrollTop = scrollTop
			this.updateZone(this.lastScrollTop);
		},

		updateZone (offset) {
			let delta = this.$options.delta;
			let overs = Math.floor(offset / this.size);
			delta.keeps = this.remain + Math.round(this.remain / 2); //�������� ��� ����, ����� ����������� �������� ������

			if (!offset) {
				this.$emit('toTop');
			}

			// need moving items at lease one unit height
			// @todo: consider prolong the zone range size
			let start = overs ? overs : 0;
			let end = overs ? (overs + delta.keeps) : delta.keeps;

			// avoid overflow range
			if (overs + this.remain >= delta.total) {
				end = delta.total;
				start = delta.total - delta.keeps;
				this.$emit('toBottom');
			}

			delta.end = end;
			delta.start = start;

			// call component to update items
			this.$forceUpdate();
		},

		filter (slots) {
			if (!slots) slots = []

			let delta = this.$options.delta;

			delta.total = slots.length;
			delta.paddingTop = this.size * delta.start;
			delta.allPadding = this.size * (slots.length - delta.keeps);

			return slots.filter((slot, index) => {
				return index >= delta.start && index <= delta.end;
			});
		},

    unFilter (newItems) {
      let delta = this.$options.delta;
      let r = []
			for(let index in this.items){
      	let item = this.items[index]
				if (index >= delta.start && index <= delta.end){
          item = newItems[index - delta.start]
        }
				r.push(item)
			}
			return r
    },

		onDraggable (newItems) {
      this.$emit('onDraggable', this.unFilter(newItems))
    }
	},

	beforeMount () {
		let delta = this.$options.delta;
		let benchs = Math.round(this.remain / 2);

		delta.end = this.remain + benchs;
		delta.keeps = this.remain + benchs;
		delta.viewHeight = this.size * this.remain; //����������� ������ ������ ����������
	},
  mounted(){
  //  this.countScrollTop();
  },
  unmounted(){
    alert()
  	//  this.countScrollTop();
  },

  //���� ������ �� �����������, �� �� ����� ��������� � ���� ����� ��� �� ��� �� ������ �������
  activated(){
    this.$refs.container.scrollTop = this.lastScrollTop
    this.updateZone(this.lastScrollTop)
	},
	render (createElement) {
		let showList = this.filter(this.$slots.default);
		let { paddingTop, allPadding } = this.$options.delta;
		let self = this

		// ��� ����� ������ � draggable ���. ��� ��������� � ��������� showList ������ draggable
		let draggable = createElement('draggable',
			{
        'ref': 'draggable',
				props: {
					// ����� ����� � draggable ������� ������ �� items, ������� ������� ������������, ����� ��� ��������
					// ��� ����� � �������� items � �������������� �� �������� showList, ������� �������� �������� �� ������
					value: self.filter(self.items),
          options: {
						// �������, �� ������� ����� �������
            handle: '.drag_area',
            animation: 150,
					}
				},
        on: {
					// ����� � ����� ��������������� ������ ����� �������, ��� ��� ������ ������� �� �������,
					// ������� �� ����������, ��������� �������� draggable �� �����
          input: self.onDraggable,
					// ���� �������� draggable ������ ������� ������, ����� � ��� �� ��� ������������
					// � ��� ����� draggable �����������������, ���� ��� �� �������� ������.
          start() {
          	self.isDragded = true
          },
          end() {
          	self.isDragded = false
            self.countScrollTop();
          }
        }
			}, [showList]
    )

    return createElement('div', {
			'ref': 'container',
			'class': this.klass,
			'style': {
				'overflow-y': 'auto',
				'height': this.size * this.remain + 'px'
			},
			'on': {
				'scroll': this.handleScroll,
			}
		}, [
			createElement('div', {
				'style': {
					'padding-top': paddingTop + 'px',
					'padding-bottom': allPadding - paddingTop + 'px'
				}
			}, [
        draggable
			])
  	]);
	}
});

module.exports = VirtualList;