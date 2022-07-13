import { LightningElement, api, wire, track } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import ACCOUNT_FIELD from '@salesforce/schema/Opportunity.AccountId';
import doInit from '@salesforce/apex/NewOpportunityController.doInit';
import { NavigationMixin } from 'lightning/navigation';
import { CloseActionScreenEvent } from 'lightning/actions';



export default class NewOpportunityLwcComponent extends NavigationMixin (LightningElement) {

    // Flexipage provides recordId and objectApiName
    @api recordId;
    //@api objectApiName;
    objectApiName = "Opportunity";

   
    @track fields = [];
    isCreateable = false;
    sObjectLabel = '';
    headerLabel = '';
    showSpinner = true;

    @api parentRecordId;
    @api parentSObject;
    // @api isNotAction = false;

    @api recordTypeId;

    //If has recordId
    // @api curRecord;

    // //Component variables
    //  showSpinner = true;

    // 
    // @track savefieldsPrevious = [];
    // @track isAllowDuplicate = false;
    // @track isDuplicateRequest = false;
    // @track duplicateColumns = [];
    // @track duplicateRecords = [];
    // @track errorMessage = '';    
    // @api personalInfoFields = [];

    @wire(doInit, {
        objectApiName: '$objectApiName',
    })
    wiredInitializedData({
        error,
        data
    }) {
        if (data) {
            this.isCreateable = data.isCreateable;
            this.sObjectLabel = data.sObjectLabel;
            this.headerLabel = 'Create: '+ data.sObjectLabel;
            data.fields.forEach((fd) => {
                const fieldProperties = JSON.parse(fd);
                const {
                    fieldSetProperties,
                    fieldDescribeProperties
                } = fieldProperties;
                this.fields.push({
                    name: fieldDescribeProperties.name,
                    isRequired: fieldSetProperties.required || fieldSetProperties.dbRequired,
                    //isUpdateable: !!fieldDescribeProperties.updateable,
                    editable: !!fieldDescribeProperties.updateable
                });
            });
            this.showSpinner = false;

           // this.afterInit();
        } else if (error) {
            console.log(error);
            var message = '';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }

            const event = new ShowToastEvent({
                title: 'Возникла ошибка при инициализации компонента',
                message: message,
                variant: "error",
                mode: 'sticky'
            });
            

            this.dispatchEvent(event);
            this.showSpinner = false;
        }
    }


    
    afterInit(){
        var isNoEvents = true;

        //Get Parent field if record is created from Parent record.
        if(!!this.parentSObject){
            isNoEvents = false;
            getParentField({objectApiName: this.objectApiName,parentSObject: this.parentSObject}).then(result => {
                if (!!this.parentRecordId && !!this.parentSObject){
                    if (!!result){
                        this.template.querySelectorAll('lightning-input-field').forEach(element => {
                            if(element.fieldName == result){
                                element.value = this.parentRecordId;
                            }
                        });
                    }
                }
                this.showSpinner = false;
            }).catch(error => {
                var message = '';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }

                const event = new ShowToastEvent({
                    title: 'Возникла ошибка при инициализации компонента',
                    message: message,
                    variant: "error",
                    mode: 'sticky'
                });
                this.dispatchEvent(event);
                this.showSpinner = false;
            });
        }

        //Get current record values (To prevent submit of unchanged form)
        if (!!this.recordId && this.personalInfoFields.length>0){
            isNoEvents = false;
            getRecordById({recordId: this.recordId,objectApiName: this.objectApiName, fields: this.personalInfoFields}).then(result => {
                console.log(result);
                if (!!result){
                    this.curRecord = result;
                }
                this.showSpinner = false;
            }).catch(error => {
                var message = '';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }

                const event = new ShowToastEvent({
                    title: 'Возникла ошибка при инициализации компонента',
                    message: message,
                    variant: "error",
                    mode: 'sticky'
                });
                this.dispatchEvent(event);
                this.showSpinner = false;
            });
        }
        if (isNoEvents){
            this.showSpinner = false;
        }
    }
   
    handleCancel(event){
        console.log('Handle Cancel');
        //this.dispatchEvent(new CloseActionScreenEvent());

        if (!!this.parentRecordId && !!this.parentSObject){
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.parentRecordId,
                    objectApiName: this.parentSObject,
                    actionName: 'view'
                }
            });
        }else{
            this[NavigationMixin.Navigate]({
                type: 'standard__objectPage',
                attributes: {
                    objectApiName: this.objectApiName,
                    actionName: 'home',
                },
            });
        }
        
    }

}