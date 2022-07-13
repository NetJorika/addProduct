({
    processResults : function(results, returnFields, searchText) {
        returnFields = returnFields.map(function(element) {
            if (element.includes('.')) {
                let el = element.replace('.', '');
                return el;
            } else {
                return element;
            }
        });
        var regEx = null;
        if (searchText != null && searchText.length> 0) {
            regEx = new RegExp(searchText, 'gi');
        }
        results = results.map(function(element){
            let el = Object.assign(element);
            el.AccountName = el.Account ? el.Account.Name : "";  
            return el;
        });

        for (var i = 0; i < results.length; i++) {
            
            results[i]['Field0'] = results[i][returnFields[0]].replace(regEx,'<mark>$&</mark>');
            for(var j = 1; j < returnFields.length; j++){
                var fieldValue = results[i][returnFields[j]];
                if (fieldValue) {
                    results[i]['Field1'] = (results[i]['Field1'] || '') + ' • ' + fieldValue;
                }
            }
            if (results[i]['Field1']) {
                results[i]['Field1'] = results[i]['Field1'].substring(3).replace(regEx,'<mark>$&</mark>');
            }
        }
        return results;
    }
})