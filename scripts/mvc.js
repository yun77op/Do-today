(function() {

    var Document, Documents,
        DocumentView, DocumentsView,
        TagsView, AppView;



    Document = Backbone.Model.extend();


    Documents = new Backbone.Collection();

    Documents.model = Document;
    Documents.url = 'documents';

    DocumentView = Backbone.View.extend({
        tagnName: 'div',
        template: _.template($('#document-template').html()),
        initialize: function() {
            _.bindAll(this, 'render');
        },
        render: function(document) {
            $(this.el).append(this.template(document));
            return this;
        },

        events: {
            
        }
    });


    DocumentsView = Backbone.View.extend({
        model: Document,
        el: $('#documents-container'),
        events: {
            'click .prev': 'getPrevPage',
            'click .next': 'getNextPage'
        },
        getPrevPage: function() {
            this.model.fetch();
        },
        getNextPage: function() {
            
        },

        render: function(documents) {
            var el = this.el;
            documents.each(function(document) {
                var d = new Document({model: document});
                el.append(d.el);
            });
        },

        initialize: function() {
            _.bindAll(this, 'render');
            this.Collection.bind('refresh', this.render);
        }
    });

    SearchView = Backbone.View.extend({
        el: $('#search'),

        events: {
          'focus input[name="s"]': 'focus',
          'blur input[name="s"]': 'blur',
          'submit': 'submit'
        },

        initialize: function(model) {
          _.bindAll(this, 'search', 'reset');
        },

        focus: function(e) {
          var element = $(e.currentTarget);
          if (element.val() === 'Search')
            element.val('');
        },

        blur: function(e) {
          var element = $(e.currentTarget);
          if (element.val().length === 0)
            element.val('Search');
        },

        submit: function(e) {
          e.preventDefault();
          this.search($('input[name="s"]').val());
        },

        reset: function() {
          this.el.find("input[name='s']").val('Search');
        },

        search: function(value) {
          $.post('/search.json', { s: value }, function(results) {
            appView.documentList.el.html('<li><a id="show-all" href="#">Show All</a></li>');

            if (results.length === 0) {
              alert('No results found');
            } else {
              for (var i = 0; i < results.length; i++) {
                var d = new Document(results[i]);
                appView.documentList.addDocument(d);
              }
            }
          }, 'json');
        }
    });



    //Tags
    TagsView = Backbone.View.extend({
        el: $('#sidebar'),
        events: {
            'click .hd a': 'create'
        },

        create: function(e) {
            e.preventDefault();
            var tag = prompt('Enter a tag name');
            if (tag) {
                $.ajax('/create/tag', {
                    type: 'POST',
                    context: this,

                    data: {
                        tag: tag
                    },

                    success: function() {
                        var tmpl = '<li><a href="#tag/{{ tag }}">{{ tag }}</a></li>',
                            result = _.template(tmpl, {tag: tag});
                        $('.bd ul', this.el).append($(result));
                    },

                    error: function(xhr, textStatus, errorThrown) {
                        alert(errorThrown);
                    }
                });
            }
        }
    });


    AppView = Backbone.View.extend({
        initialize: function() {
            this.tagsView = new TagsView();
        }
    });

    var appView = new AppView();


    //create document
    $('#shorten-container').click(function(e) {
        e.stopPropagation();
    }).delegate('form', 'submit', function(e) {
        e.preventDefault();
        var o = $(this);
        $.ajax('/create/document', {
            type: 'POST',
            data: o.serialize(),
            success: function(data, textStatus, xhr) {
                $(document).trigger('click.ui');
            },
            error: function(xhr, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
    });


})();