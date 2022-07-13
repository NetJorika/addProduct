({
    getRecordTypes : function(component, event, contactId) {
        var action = component.get("c.getRecordTypes");
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "ERROR"){
                component.set("v.spinner", false);
                console.log('ERROR ttt ', response.getError());
                var er = response.getError();
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "type": "error",
                    "message": er
                });

            }
            if (component.isValid() && state === "SUCCESS"){
                component.set("v.spinner", false);
                /*console.log('SUCCESS getRecordTypes ', response.getReturnValue());
                var ret = response.getReturnValue();
                var optionsRecord = component.get("v.recordTypeOption");
                let options = ret.map(function(element) {
                    return {label:element.Name, value:element.Id};
                });
                optionsRecord = options;
                // console.log('optionsRecord', optionsRecord);
                component.set("v.recordTypeOption", optionsRecord);
                component.set("v.recordTypeValue", optionsRecord[0].value);*/
            }
        });
        $A.enqueueAction(action);

    },

    setOppNameAndAddProduct : function(component, event, productList, myRecordId)  {

        var action = component.get("c.setOppNameAndAddProduct");
        action.setParams({
            "idOpportunity": myRecordId,
            "oppItemsList": productList
        });
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "ERROR"){
                var er = response.getError();
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "type": "error",
                    "message": er
                });
                toastEvent.fire();
            }
            if (component.isValid() && state === "SUCCESS"){
                var ret = response.getReturnValue();
                if (ret) {
                    component.set("v.spinner", false);
                    var toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams({
                        "type": "error",
                        "message": ret
                    });
                    toastEvent.fire();
                } else {
                    component.set("v.spinner", false);
                    var toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams({
                        "type": "success",
                        "message": "Сделка успешно сохранена!"
                    });
                    toastEvent.fire();
                    var navEvt = $A.get("e.force:navigateToSObject");
                    navEvt.setParams({
                        "recordId": myRecordId,
                        "slideDevName": "detail"
                    });
                    navEvt.fire();
                }
            }
        });
        $A.enqueueAction(action);

    },

    getAccountName : function(component, event, accountId, fields) {
        var action = component.get("c.getAccount");
        action.setParams({"ids":accountId});
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "ERROR"){
                component.set("v.spinner", false);
                console.log('ERROR ttt ', response.getError());
                var er = response.getError();
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "type": "error",
                    "message": er
                });
                component.set("v.spinner", false);

            }
            if (component.isValid() && state === "SUCCESS"){
                var ret = response.getReturnValue();
                //console.log('ret', ret);
                var selectedRecordTypeId = component.get("v.recordTypeValue");
                var opportunityNumber = component.get("v.opportunityNumber");
                var accountNameField = component.get("v.selectedAccount");
                var endCustomerField = component.get("v.selectedEndCustomer");
                var contactNameField = component.get("v.selectedContact");
                var responsibleUserField = component.get("v.selectedResponsibleUser");
                fields.Name = ret.Name + '-' + opportunityNumber;
                fields.RecordTypeId = selectedRecordTypeId;
                fields.AccountId = accountNameField;
                fields.EndCustomer__c = endCustomerField;
                fields.Contact__c = contactNameField;
                fields.ResponsibleUser__c = responsibleUserField;
                //console.log('before find', fields);
                component.find("recordEditFormOpportunity").submit(fields);
                //console.log('after find');
            }
        });
        $A.enqueueAction(action);

    },

    getServiceAutonumbered : function(component, event) {
        var action = component.get("c.getServiceAutonumbered");
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "ERROR"){
                console.log('ERROR ttt ', response.getError());
                component.set("v.opportunityNumber", "0000");
            }
            if (component.isValid() && state === "SUCCESS"){
                var ret = response.getReturnValue();
                component.set("v.opportunityNumber", ret.Opportunity_Number__c);
            }
        });
        $A.enqueueAction(action);
    },

    getCurrentUser: function(component, event) {
        var action = component.get("c.getCurrentUser");

        action.setCallback( this, function(response){
            var state = response.getState();
            if (state === "ERROR"){
                component.set("v.spinner", false);
                console.log('ERROR ttt ', response.getError());
                var er = response.getError();
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "type": "error",
                    "message": er
                });
            }
            if (component.isValid() && state === "SUCCESS"){
                var usr = response.getReturnValue();
                component.set("v.selectedResponsibleUser", usr.Id);
                if(usr.Profile.Name != 'Sales Supervisor' && usr.Profile.Name != 'System Administrator' && usr.Profile.Name != 'Системный администратор') {
                    component.set("v.disableResponsibleUser", true);
                }
            }
        });
        $A.enqueueAction(action);
    },

    getParameterByName: function(component, event, name) {
        name = name.replace(/[\[\]]/g, "\\$&");
        var url = window.location.href;
        var regex = new RegExp("[?&]" + name + "(=1\.([^&#]*)|&|#|$)");
        var results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },

})