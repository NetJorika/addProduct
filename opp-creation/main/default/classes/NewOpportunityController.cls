public with sharing class NewOpportunityController {

    public class FormEditResponse {
        @AuraEnabled
        public list<String> fields;

        @AuraEnabled
        public String sObjectLabel;

        @AuraEnabled
        public Boolean isCreateable; 
    }

    private static void processException(String msg, String stackTraceString) {
        AuraHandledException ex = new AuraHandledException(msg);
        ex.setMessage(msg + (String.isNotBlank(stackTraceString) ? ' ' + stackTraceString : ''));
        throw ex;
    }

    @AuraEnabled(Cacheable=true)
    public static FormEditResponse doInit(String objectApiName) {
        FormEditResponse response = new FormEditResponse();
        response.fields = new list<String>();
        try {
            Map<String, Schema.SObjectType> globalDescribeMap = Schema.getGlobalDescribe(); 
            Schema.SObjectType sObjectTypeObj = globalDescribeMap.get(objectApiName);
            
            Schema.DescribeSObjectResult sObjectResult = sObjectTypeObj.getDescribe();
            boolean isCreateable = sObjectResult.isCreateable();
            response.sObjectLabel = sObjectResult.getLabel();
            response.isCreateable = isCreateable;
            if (isCreateable == false){
                return response;
            }
            Map<String, Schema.FieldSet> fieldSets = sObjectResult.fieldSets.getMap();
            String keySetName = '';

            for (String name : fieldSets.keySet()){
                if (name.toLowerCase().contains('New_Opportunity_Fields'.toLowerCase())){ 
                    keySetName = name;
                } 
            }
            Map<String, Schema.SObjectField> fields = sObjectResult.fields.getMap();

            if(keySetName != ''){
                Schema.FieldSet fieldset = fieldSets.get(keySetName);
                for (Schema.FieldSetMember fieldSetMember : fieldset.getFields()) {
                    String fieldName = fieldSetMember.getFieldPath();
                    DescribeFieldResult fieldResult = fields.get(fieldName).getDescribe();
                    if (fieldResult.isAccessible()) {
                        response.fields.add(JSON.serialize(
                            new Map<String, Object>{
                                'fieldSetProperties' => fieldSetMember,
                                'fieldDescribeProperties' => fieldResult
                                }
                        ));
                    }
                }
            }
        } catch (Exception e) {
            processException(e.getMessage(), e.getStackTraceString());
        }
        return response;
    }

    @AuraEnabled
    public static List<RecordType> getRecordTypes() {
        return [SELECT Id, Name, DeveloperName FROM RecordType WHERE SobjectType = 'Opportunity'];
    }
    
    @AuraEnabled
    public static Account getAccount(Id ids) {
        return [SELECT Id, Name FROM Account WHERE Id = :ids LIMIT 1];
    }
    
    @AuraEnabled
    public static Opportunity getServiceAutonumbered() {
        return [SELECT Id FROM Opportunity ORDER BY CreatedDate DESC LIMIT 1];
    }
    
    @AuraEnabled
    public static String setOppNameAndAddProduct(String idOpportunity, List<OpportunityLineItem> oppItemsList) {

        Opportunity opp = [
            SELECT Id, Name, Account.Name 
            FROM Opportunity 
            WHERE Id = :idOpportunity
            LIMIT 1
        ];
    
        Boolean success = true;
        String errorMessage;
        try {
            if (oppItemsList != null) {
                insert oppItemsList;
            }
        } catch (DMLException e) {
            success = false;
            errorMessage = e.getDmlMessage(0).unescapeHtml4();
        }
        
        if (success == false) {
            delete opp;
        }

        return errorMessage;
    }
    
    @AuraEnabled 
    public static User getCurrentUser() {
       return [select Id, Name, Profile.Name from User where id = :UserInfo.getUserId()];
    }
}