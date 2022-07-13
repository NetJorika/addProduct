import { LightningElement, api, wire, track} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';
import { CurrentPageReference } from 'lightning/navigation';

// apex requests
import getAllProducts from '@salesforce/apex/AddProductsController.getAllProducts';
import getPricebookFromOpportunity from '@salesforce/apex/AddProductsController.getPricebookFromOpportunity';
import updateOpportunityPricebook from '@salesforce/apex/AddProductsController.updateOpportunityPricebook';
import setOppItems from '@salesforce/apex/AddProductsController.setOppItems';

// product family values
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import PRODUCT_FAMILY_PICKLIST_VALUES from '@salesforce/schema/Product2.Family';

// user default currency
import CURRENCY from '@salesforce/i18n/currency';

// Opportunity LineItem fields
import UNITPRICE_FIELD from '@salesforce/schema/OpportunityLineItem.UnitPrice';
import OPPORTUNITYID_FIELD from '@salesforce/schema/OpportunityLineItem.OpportunityId';
import PRODUCT2ID_FIELD from '@salesforce/schema/OpportunityLineItem.Product2Id';
import QUANTITY_FIELD from '@salesforce/schema/OpportunityLineItem.Quantity';
import DESCRIPTION_FIELD from '@salesforce/schema/OpportunityLineItem.Description';

// delay for onchange event on input field
const DELAY = 200;

export default class addProductsLwc extends LightningElement{

    recordId;

    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy;
    error;
    errorText;

    // variable for records on first page
    products;

    // filter fields 
    @track familiyPicklistValue = [];
    familiyErrors;
    familiesCheckbox = [];
    name = '';
    productCode = '';

    // PriceBook fields
    pricebookId = '';
    pricebookName = '';
    pricebookNone = false;
    pricebookMap;
    @track pricebookList = [];

    // state variable for page rendering
    stage = -1;

    // variable for records selection on second page
    selectedProducts = [];

    // selected Ids on first page
    @track selectedRowsKeysUpdate = [];

    // returned from wire records 
    rowsResult = [];

    // all selected rows and Ids on firset page
    allSelectedRows = [];
    @track allSelectedIds = [];

    // last modified records from second page
    lastItemsRows = [];

    // errors before save records on second page
    @track secontTableErrors = [];
    
    // show selected or returned from wire records
    isSelectedShow = false;

    //columns on first page
    columnsFirstPage = [{
            label: 'Product Name',
            fieldName: 'nameUrl',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'Name' },
                target: '_blank'},
            sortable: true
        },
        {
            label: 'Product Code',
            fieldName: 'ProductCode',
            type: 'text',
            sortable: true
        },
        {
            label: 'Price List',
            fieldName: 'ListPrice',
            type: 'currency',
            typeAttributes: { currencyCode: CURRENCY},
            cellAttributes: { alignment: 'left' },
            sortable: true
        },
        {
            label: 'Description',
            fieldName: 'Description',
            type: 'text',
            sortable: true
        },
        {
            label: 'Family',
            fieldName: 'Family',
            type: 'text',
            sortable: true
        }
    ];

    //columns on second page
    columnsSecondPage = [
        {
            type: 'button-icon',
            typeAttributes: {
                iconName: 'utility:delete',
                name: 'delete'
            },
            initialWidth: 50
        },
        {
            label: 'Product',
            fieldName: 'nameUrl',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'Name' },
                target: '_blank'},
            sortable: false,
            displayReadOnlyIcon: true,
        },
        {
            label: 'Quantity',
            fieldName: 'Quantity',
            type: 'number',
            sortable: false,
            editable: true,
            initialWidth: 100
        },
        {
            label: 'Price List',
            fieldName: 'ListPrice',
            type: 'currency',
            typeAttributes: { currencyCode: CURRENCY},
            sortable: false,
            initialWidth: 120,
            displayReadOnlyIcon: true,
        },
        {
            label: 'Selling price',
            fieldName: 'UnitPrice',
            type: 'currency',
            typeAttributes: { currencyCode: CURRENCY},
            sortable: false,
            editable: true,
            initialWidth: 120
        },
        {
            label: 'Comment',
            fieldName: 'DescriptionComment',
            type: 'text',
            sortable: false,
            editable: true,
        }
    ];

    // get product list
    @wire(getAllProducts, { 
        inputName: '$name', 
        pricebookId: '$pricebookId',
        inputProductCode: '$productCode',
        inputFamilies: '$familiesCheckbox'
    })wiredProducts(result) {
        const { error, data } = result;

        if (data) {
            this.error = undefined;
            
            let currentData = [];
            let currentIds = [];
            data.forEach((row) => {
                let rowData = {};
                if (row.Product2) {
                    rowData.Name = row.Product2.Name;
                    rowData.Description = row.Product2.Description;
                    rowData.Family = row.Product2.Family; 
                    rowData.ProductCode = row.Product2.ProductCode;    
                }
                rowData.Id = row.Product2Id;
                rowData.nameUrl = `/${row.Product2Id}`;
                rowData.UnitPrice = row.UnitPrice;      
                rowData.ListPrice = row.UnitPrice;      
                currentData.push(rowData);
                currentIds.push(row.Product2Id);
            });
                
            this.products = [...currentData];
            this.selectedRowsKeysUpdate = [...this.allSelectedIds];

            this.isSelectedShow = false;
        } else if (error) {
            this.error = error;
            this.products = undefined;
        }
    }

    // connectedCallback() {
    //     console.log('1 connectedCallback', this.recordId,this.stage);
    // }
       
    // check and get Opportunity Pricebook on page load
    @wire(CurrentPageReference)getStateParameters(pageRef) {
        this.recordId = pageRef.state.recordId;
        this.getPricebookFromOpportunity();
    }

    // get pricebook
    getPricebookFromOpportunity() {
        getPricebookFromOpportunity({opportunityId: this.recordId})
        .then((result) => {
            if (result.errorText){
                this.errorText = result.errorText;
                this.stage = -2;
            }else if (result.pricebookId){
                this.pricebookId = result.pricebookId;
                this.pricebookName = result.pricebookName;
                this.stage = 1;
            }else{
                this.pricebookNone = true;
                this.pricebookMap = result.pricebookAll;
                for (const [key, value] of Object.entries(this.pricebookMap)) {
                    this.pricebookList.push( {label: value,value: key});
                }
                this.stage = 0;
                var css = document.body.style;
                let height = (Object.keys(this.pricebookMap).length * 40 + 75) + 'px';
                css.setProperty('--comboboxHeight', height);
            }
        })
        .catch((error) => {
            this.stage = -2;
            console.log('error of getPricebookFromOpportunity', error)
            this.errorText = error.body.message;
        });
    }
    
    // update pricebookId variable on zero page
    handlePricebookChange(event) {
        this.pricebookId = event.detail.value;
    }
    
    // Update Opportunity Pricebook on zero page when it does not choosen before
    updateOpportunityPricebook() {
        updateOpportunityPricebook({opportunityId: this.recordId, pricebookId: this.pricebookId})
        .then((result) => {
            if (result){
                getRecordNotifyChange([{recordId: this.recordId}]);
                this.getPricebookFromOpportunity();
            }
        })
        .catch((error) => {
             console.log('error of updateOpportunityPricebook', error);
        });
    }

    // get all product families from schema
    @wire(getPicklistValues, {recordTypeId: '012000000000000AAA', fieldApiName: PRODUCT_FAMILY_PICKLIST_VALUES})
    wireProductFamilyPicklistInfo({ data, error }) {
        if (data){
            this.families = data;
            data.values.forEach((element) => {
                this.familiyPicklistValue.push({
                    label: element.label,
                    value: element.value
                }); 
            });
        }else{
            this.familiyErrors = error;
            console.log('error of wireProductFamilyPicklistInfo', error);
        } 
    }

    // handle product name input change on first page
    handleKeyChange(event) {
        window.clearTimeout(this.delayTimeout);
        const searchKey = event.target.value;
        this.delayTimeout = setTimeout(() => {
            this.name = searchKey;
        }, DELAY);
    }

    // sorting rule
    sortBy(field, reverse, primer) {
        field = (field == 'nameUrl')?'Name':field;
        const key = primer
        ? function(x) {
            return primer(x[field]);
        }
        : function(x) {
            return x[field]?x[field]:'';
        };

        return function(a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }

    // handle sorting on first page
    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.products];
        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.products = [...cloneData];
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }

    // handle filter panel on first page
    showHidePanel() {
        const showPanel = this.template.querySelector('[data-id="panel"]');
        const selectedButton = this.template.querySelector('[data-id="button-search"]');
        showPanel.classList.toggle('slds-is-open');
        selectedButton.classList.toggle('slds-is-selected');
    }

    //  show Selected rows on first page 
    showSelected(){
        this.rowsResult = this.products;
        this.products = [...this.allSelectedRows];
        this.selectedRowsKeysUpdate = [...this.allSelectedIds];
        this.isSelectedShow = true;
    }

    //  return to returned rows on first page     
    hideSelected(){
        this.products = [...this.rowsResult];
        this.selectedRowsKeysUpdate = [...this.allSelectedIds];
        
        this.isSelectedShow = false;
    }

    // back button on second page
    clickBack() {
        this.stage -= 1;
        this.selectedRowsKeysUpdate = [...this.allSelectedIds];
        this.updateLastItemsRows();
    }

    // save changed Product Items in temp list to get it in future
    updateLastItemsRows(){
        let draftValues = this.template.querySelector('lightning-datatable').draftValues;
        let lastItemsRows = [...this.allSelectedRows];

        for(let i in lastItemsRows) {
            let row = draftValues?.find(x => x.Id === lastItemsRows[i].Id);
            if ( row ){
                lastItemsRows[i].Quantity = (row.Quantity === undefined )? lastItemsRows[i].Quantity: row.Quantity ;
                lastItemsRows[i].DescriptionComment = (row.DescriptionComment === undefined )? lastItemsRows[i].DescriptionComment: row.DescriptionComment ;
                lastItemsRows[i].UnitPrice = (row.UnitPrice === undefined) ? lastItemsRows[i].UnitPrice: row.UnitPrice ;
            }
        }
        this.lastItemsRows = lastItemsRows;
    }

    // for first Next button
    firstNextClick() {
        this.getAddProductsList();
        this.stage += 1;
    }

    // for first Next button
    zeroNextClick() {
        this.stage += 1;
        this.updateOpportunityPricebook();
    }

    // close modal
    closeQuickAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    // handle Family Checkbox Change on first page
    handleFamilyCheckboxChange(event) {
        this.familiesCheckbox = event.detail.value;
    }

    // handle Product Code change on first page
    handleProductCodeChange(event) {
        this.productCode = event.detail.value;
    }

    // on row selection on first page
    rowSelection(e) {
        let rows_ids = [];
        const selectedRows = e.detail.selectedRows;
        for (let i = 0; i < selectedRows.length; i++){
            rows_ids.push(selectedRows[i].Id);
        }

        let rowsToDelete = [];
        for (let x in this.products){
            if (rows_ids.includes(this.products[x].Id)){
                if (!this.allSelectedIds.includes(this.products[x].Id)){
                    this.allSelectedIds.push(this.products[x].Id);
                    this.allSelectedRows.push(this.products[x]);
                }
            }else{
                if (this.allSelectedIds.includes(this.products[x].Id)){
                    rowsToDelete.push(this.products[x].Id);
                }
            }
        }

        this.allSelectedIds = this.allSelectedIds.filter(id => !rowsToDelete.includes(id));
        this.allSelectedRows = this.allSelectedRows.filter(row => !rowsToDelete.includes(row.Id));   

    }

    // on delete icon press on second page
    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        switch (action.name) {
            case 'delete':
                this.allSelectedIds.splice(this.allSelectedIds.indexOf(row.Id), 1);
                this.selectedRowsKeysUpdate.splice(this.selectedRowsKeysUpdate.indexOf(row.Id), 1);

                this.allSelectedRows = this.allSelectedRows.filter(x => row.Id != x.Id);
                this.selectedProducts = this.selectedProducts.filter(x => row.Id != x.Id);
                this.selectedRowsKeysUpdate = this.selectedProducts.filter(x => row.Id != x.Id);
                break;
        }
    }

    // set up table on second page
    getAddProductsList() {
        let selectedProductsProxy = [...this.allSelectedRows];
        for(let i in selectedProductsProxy) {
            let row = this.lastItemsRows?.find(x => x.Id === selectedProductsProxy[i].Id);
            if ( row ){
                selectedProductsProxy[i].Quantity = row.Quantity;
                selectedProductsProxy[i].DescriptionComment = row.DescriptionComment;
                selectedProductsProxy[i].UnitPrice = row.UnitPrice;
            }else{
                selectedProductsProxy[i].Quantity = 1;
                selectedProductsProxy[i].DescriptionComment = null;
            }
        }
        this.selectedProducts = [...selectedProductsProxy];
        this.lastItemsRows = [...selectedProductsProxy];
    }

    // on Save button press on second page
    @api
    saveOpportunityLineItem() {
        this.updateLastItemsRows();
/*
        // check Line Items
        let secontTableErrors = {rows:{}};
        let errorsExists = false;
        for(let i in this.lastItemsRows) {
            let messages = [];
            let fieldNames = [];
            let rowErrorCount = 0;
            if (!this.lastItemsRows[i].Quantity || this.lastItemsRows[i].Quantity < 1){
                rowErrorCount += 1;
                messages.push('Quantity must be more than 0.');
                fieldNames.push('Quantity');
         
            }
            if (!this.lastItemsRows[i].SellPrice || this.lastItemsRows[i].SellPrice < 0 || this.lastItemsRows[i].SellPrice == ''){
                rowErrorCount += 1;
                messages.push('Sellig price must be more or equal 0.');
                fieldNames.push('SellPrice'); 
         
            }
            if (rowErrorCount > 0){
                errorsExists = true;
                secontTableErrors.rows[this.lastItemsRows[i].Id]= {
                    'title' : 'We found ' + rowErrorCount + ' error' + ((rowErrorCount>1)?'s':'') + '.',
                    'messages' : messages,
                    'fieldNames' : fieldNames
                }
            }
        }
        if (errorsExists){
            this.secontTableErrors = secontTableErrors;
            return;
        }*/

        // save correct data
        let productItems = [];
        for(let i in this.lastItemsRows) {
            let fields = {};
            fields[UNITPRICE_FIELD.fieldApiName] = this.lastItemsRows[i].UnitPrice;
            fields[OPPORTUNITYID_FIELD.fieldApiName] = this.recordId;
            fields[PRODUCT2ID_FIELD.fieldApiName] = this.lastItemsRows[i].Id;
            fields[QUANTITY_FIELD.fieldApiName] = this.lastItemsRows[i].Quantity;
            fields[DESCRIPTION_FIELD.fieldApiName] = this.lastItemsRows[i].DescriptionComment;
            productItems.push(fields);
        }
        this.setOpportunityLineItems(productItems);
    }

    // save new Opportunity Line Items
    setOpportunityLineItems(oppItems) {
        setOppItems({
            oppItemsList: oppItems
        })
        .then((result) => {
            if (result) {

                let errors = JSON.parse(result);

                let secontTableErrors = {rows:{}};
                let errorsExists = false;
                for(let i in errors) {
                    let messages = [];
                    let fieldNames = [];
                    let rowErrorCount = 0;

                    if (errors[i].fields){
                        rowErrorCount += 1;
                        messages.push(errors[i].error);
                        fieldNames.push(errors[i].fields);
                    }
                
                    if (rowErrorCount > 0){
                        errorsExists = true;
                        secontTableErrors.rows[this.lastItemsRows[errors[i].rowNum].Id]= {
                            'title' : 'We found ' + rowErrorCount + ' error' + ((rowErrorCount>1)?'s':'') + '.',
                            'messages' : messages,
                            'fieldNames' : fieldNames
                        }
                    }
                }

                if (errorsExists){
                    this.secontTableErrors = secontTableErrors;
                    return;
                }
                
                const evt = new ShowToastEvent({
                    title: 'Error on record save',
                    variant: "error"
                });
                this.dispatchEvent(evt);
                // const errorEvent = new CustomEvent('erroroppline');
                // this.dispatchEvent(errorEvent);
            } else {
                const evt = new ShowToastEvent({
                    title: "Your Products have been successfully added to the Opportunity!",
                    variant: "success"
                });
                this.dispatchEvent(evt);
                // const successEvent = new CustomEvent('successoppline');
                // this.dispatchEvent(successEvent);
                eval("$A.get('e.force:refreshView').fire();");
                this.closeQuickAction();
            }
        })
        .catch((error) => {
            console.log('error of setOpportunityLineItems', error)
            const evt = new ShowToastEvent({
                title: 'Error on record save',
                variant: "error",
                message: error.body.message
            });
            this.dispatchEvent(evt);
        });
    }

    // get stage for template
    get getErrorStage(){
        return this.stage == -2;
    }

    // get stage for template
    get getSpinnerStage(){
        return this.stage == -1;
    }

    // get stage for template
    get getZeroStage(){
        return this.stage == 0;
    }

    // get stage for template
    get getFirstStage(){
        return this.stage == 1;
    }

    // get stage for template
    get getSecondStage(){
        return this.stage == 2;
    }

    // disable Svae button on zero page
    get isPricebookNotExists(){
        return !this.pricebookId;
    }   

    // disable Next button on first page
    get isSecondNextButtonDisabled(){
        return (this.allSelectedIds.length>0)?false:true;
    } 

    // show link to selected rows on first page
    get isSelectedRowsKeysZero(){
        return this.allSelectedIds?.length == 0;
    } 

    // show text when Product Family set
    get isFilteredByFamily(){
        return this.familiesCheckbox?.length != 0;
    }  

    // show text when Product Code set 
    get isFilteredByProductCode(){
        return this.productCode;
    }  

    // show text when Product Code or Family set 
    get isFilteredBy(){
        return this.productCode || this.familiesCheckbox?.length != 0;
    }  

    // show text when Product Code and Family set 
    get isFilteredByAll(){
        return this.productCode && this.familiesCheckbox?.length != 0;
    }  
}