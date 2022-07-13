({
    doInit : function(component, event, helper) {
        var ids = component.get("v.recordId");
        helper.getRecordTypes(component, event);
		helper.getServiceAutonumbered(component, event);
		helper.getCurrentUser(component, event);
		var value = helper.getParameterByName(component , event, 'inContextOfRef');
        var context = JSON.parse(window.atob(value));
		component.set("v.parentRecordId", context.attributes.recordId);
		var parentRecordId = component.get("v.parentRecordId");
		component.set("v.selectedAccount", parentRecordId);

		component.set("v.recordTypeId", component.get("v.pageReference").state.recordTypeId);
    },

    closeModal: function(component, event, helper) {
		$A.get('e.force:refreshView').fire();
		window.history.back();
    },

    save: function(component, event, helper) {
		console.log('save');
		var accountNameField = component.get("v.selectedAccount");
		var stageNameField = component.find("stageNameField").get("v.value");
		var probabilityField = component.find("probabilityField").get("v.value");
		var typeOfPaymentField = component.find("typeOfPaymentField").get("v.value");
		var forecastContractTerm = component.find("forecastContractTerm").get("v.value");
		var leadSourceField = component.find("leadSourceField").get("v.value");
		var currencyField = component.find("currencyField").get("v.value");
		var closeDateField = component.find("closeDateField").get("v.value");
		var typeField = component.find("typeField").get("v.value");
		var fourthPage = component.get("v.fourthPage");
		var secondPage = component.get("v.secondPage");
		var periodType = component.find("periodType").get("v.value");
		var licenseType;
		var periodTypesOfPayment = ['Помесячно', 'Квартальный'];

		if (fourthPage === true) {
			var amountField = component.find("amountField").get("v.value");
			console.log('amountField', amountField);

			if (accountNameField && closeDateField && currencyField && stageNameField && probabilityField
				&& typeField && leadSourceField && amountField && typeOfPaymentField && forecastContractTerm
				&& ((periodTypesOfPayment.indexOf(typeOfPaymentField) > -1 && periodType)
					||
				   (periodTypesOfPayment.indexOf(typeOfPaymentField) == -1 && !periodType))) {

				component.set("v.spinner", true);
				document.getElementById('submitOpportunity').click();
			}
			else {
				var toastEvent = $A.get("e.force:showToast");
				toastEvent.setParams({
					"type": "error",
					"message": "Заполните обязательные поля."
				});
				toastEvent.fire();
			}
		}
		else {
			if(secondPage === true) {
				licenseType = component.find("licenseType").get("v.value");
			}

			if (accountNameField && closeDateField && currencyField && stageNameField && probabilityField
				&& typeField && leadSourceField && typeOfPaymentField && forecastContractTerm
				&& ((periodTypesOfPayment.indexOf(typeOfPaymentField) > -1 && periodType)
					||
				   (periodTypesOfPayment.indexOf(typeOfPaymentField) == -1 && !periodType))
				&& ((secondPage && licenseType) || !secondPage)
			) {
				document.getElementById('submitOpportunity').click();
			}
			else {
				var toastEvent = $A.get("e.force:showToast");
				toastEvent.setParams({
					"type": "error",
					"message": "Заполните обязательные поля."
				});
				toastEvent.fire();
			}
		}
	},

	handleSubmitOpportunity: function(component, event, helper) {
		component.set("v.spinner", true);
		event.preventDefault();
		var fields = event.getParam('fields');
		var accountId = component.get("v.selectedAccount");
		helper.getAccountName(component, event, accountId, fields);
	},

	handleErrorOpportunity: function(component, event, helper) {

		component.set("v.spinner", false);
		var error = event.getParam("error");
        console.log(error.message); // main error message

        if (error.data){
            // top level error messages
            error.data.output.errors.forEach(
                function(msg) { console.log(msg.errorCode);
                               console.log(msg.message); }
            );

            // field specific error messages
            Object.keys(error.data.output.fieldErrors).forEach(
                function(field) {
                    error.data.output.fieldErrors[field].forEach(
                        function(msg) { console.log(msg.fieldName);
                                       console.log(msg.errorCode);
                                       console.log(msg.message); }
                    )
                });
        }

	},

	handleSuccessOpportunity: function(component, event, helper) {

		var record = event.getParam("response");
		var apiName = record.apiName;
		var myRecordId = record.id;
		var fourthPage = component.get("v.fourthPage");
		if (fourthPage === false) {
			var state = component.find('addproduct').getSecondState();
			var productList;

			if (state) {
				productList = component.find('addproduct').getProductItems(myRecordId);
			}

			helper.setOppNameAndAddProduct(component, event, productList, myRecordId);
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

	},

    nextPage: function(component, event, helper) {

		var recordTypeOption = component.get("v.recordTypeOption");
		console.log('recordTypeOption', recordTypeOption);
		var recordTypeValue = component.get("v.recordTypeValue");
		console.log('recordTypeValue', recordTypeValue);
		component.set("v.oppRecordTypeId", recordTypeValue);

		component.set("v.firstPage", false);

		recordTypeOption.forEach(element => {
			if (element.label === 'Техподдержка') {

				var idLabel = element.value;
				if (recordTypeValue === idLabel) {
					component.set("v.thirdPage", true);
				}

			} else if (element.label === 'Продажа партнерских продуктов' || element.label === 'Продажа услуг') {

				var idLabel = element.value;
				if (recordTypeValue === idLabel) {
					component.set("v.fourthPage", true);
				}

			} else {

				var idLabel = element.value;
				if (recordTypeValue === idLabel) {
					component.set("v.secondPage", true);
				}
			}

			if (element.value === recordTypeValue) {
				component.set("v.recordTypeTitle", element.label);
			}
		})
	},

	handleChange: function(component, event, helper) {
		var changeValue = event.getParam("value");
		component.set("v.recordTypeValue", changeValue);
		var recordTypeValue = component.get("v.recordTypeValue");
	},

	handleChangeSolution : function(component, event, helper) {
		var changeValue = event.getParam("value");
		component.set("v.selectedSolution", changeValue);
		var selectedSolution = component.get("v.selectedSolution");
		var filter = component.find('addproduct').filterBySolution();
	},

	handleChangePaymentType : function(component, event, helper) {
		var changeValue = event.getParam("value");
		if(changeValue == 'Смешанный') {
			component.set("v.notMixedPayment", false);
		}
		else {
			component.set("v.notMixedPayment", true);
			component.find("paymentProportionField").reset();
		}
	},
})