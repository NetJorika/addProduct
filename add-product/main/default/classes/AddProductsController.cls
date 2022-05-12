public with sharing class AddProductsController {

    // structure for pricebook request
    public class PricebookResult {

        @AuraEnabled
        public String pricebookId;

        @AuraEnabled
        public String pricebookName;

        @AuraEnabled
        public String errorText;

        @AuraEnabled
        public Map<String,String> pricebookAll;
    }
	
    // get Pricebook From Opportunity or List of all Pricebooks
    @AuraEnabled
    public static PricebookResult getPricebookFromOpportunity(Id opportunityId) {
        PricebookResult res = new PricebookResult();

        // Check permissions
        if (Schema.sObjectType.Pricebook2.fields.Name.isAccessible() 
            && Schema.sObjectType.Product2.fields.Family.isAccessible()
            && Schema.sObjectType.Product2.fields.Description.isAccessible()
            && Schema.sObjectType.Product2.fields.ProductCode.isAccessible()
            && Schema.sObjectType.Product2.fields.Name.isAccessible()
            && Schema.sObjectType.Opportunity.fields.Pricebook2Id.isAccessible()
            && Schema.sObjectType.PricebookEntry.fields.UnitPrice.isAccessible()
            && Schema.sObjectType.OpportunityLineItem.isCreateable()
            && Schema.sObjectType.OpportunityLineItem.fields.UnitPrice.isUpdateable()
            && Schema.sObjectType.OpportunityLineItem.fields.Quantity.isUpdateable()
            && Schema.sObjectType.OpportunityLineItem.fields.Description.isUpdateable()
        ){
            List<Opportunity> oppList = [SELECT Id, Pricebook2Id, Pricebook2.Name FROM Opportunity WHERE Id = :opportunityId];
            if (oppList.size() == 1 && String.isNotEmpty(oppList[0].Pricebook2Id)){
                    res.pricebookId = oppList[0].Pricebook2Id;
                    res.pricebookName = oppList[0].Pricebook2.Name;
            }else{
                if (Schema.sObjectType.Opportunity.fields.Pricebook2Id.isUpdateable()){
                    List<Pricebook2> pricebookList = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true];
                    Map<String,String> pricebookAll = new Map<String,String>();
                    for (Pricebook2 pricebook : pricebookList){
                        pricebookAll.put(pricebook.Id, pricebook.Name);
                    }
                    res.pricebookAll = pricebookAll;
                }else{ res.errorText = 'You do not have enough permissions to set Pricebook to Opportunity.';}
            }
        }else{ res.errorText = 'You do not have enough permissions.';}
        
        return res;
    }

    // update Opportunity Pricebook from zero page
    @AuraEnabled
    public static boolean updateOpportunityPricebook(Id opportunityId, Id pricebookId) {
        List<Opportunity> oppList = [SELECT Id, Pricebook2Id, Pricebook2.Name FROM Opportunity WHERE Id = :opportunityId];

        try{
            if (oppList.size() ==1 && String.isNotEmpty(pricebookId) ){
                oppList[0].Pricebook2Id = pricebookId;
                update oppList;
            }
            return true;
        }catch(Exception e){
            return false;
        }
    }

    // get filtred product list
    @AuraEnabled(cacheable=true)
    public static List<PricebookEntry> getAllProducts(String inputName, Id pricebookId, String inputProductCode, List<String> inputFamilies) {
          
        List<PricebookEntry> newlist = null;
        if (String.isNotEmpty(pricebookId)){
            String queryString = 'SELECT Product2Id, Pricebook2Id, Product2.Name, Product2.ProductCode, UnitPrice, Product2.Description, Product2.Family FROM PricebookEntry WHERE Pricebook2Id = :pricebookId';

            if (String.isNotEmpty(inputName) && inputName != '') {
                inputName = '%' + inputName + '%';
                queryString += ' AND Product2.Name LIKE :inputName';
            } 

            if (String.isNotEmpty(inputProductCode) && inputProductCode != '') {
                inputProductCode = '%' + inputProductCode + '%';
                queryString += ' AND Product2.ProductCode LIKE :inputProductCode';
            } 

            if (inputFamilies != null && !inputFamilies?.isEmpty()) {    
                queryString += ' AND Product2.Family IN :inputFamilies';
            }

            queryString += ' ORDER BY Product2.Name';
            newlist = DataBase.query(queryString);
        }
        return newlist; 
    }

    // save Opportunity Line Items
    @AuraEnabled
    public static String setOppItems(List<OpportunityLineItem> oppItemsList){
        String errorMessage;
        Boolean success = true;
        try {
            if (oppItemsList != null) {
                insert oppItemsList;
            }
        } catch (DMLException e) {
            success = false;
            errorMessage = '[';
            if (e.getNumDml() > 0){
                for (Integer index = 0; index < e.getNumDml(); index++){
                    if (index != 0){ 
                        errorMessage += ',';
                    }
                    errorMessage += '{';
                    errorMessage += '"rowNum":' + e.getDmlIndex(index) + ','; 
                    if (e.getDmlFieldNames(index).size() > 0){
                        errorMessage += '"fields":"'; 
                        for (Integer fieldNumber = 0; fieldNumber < e.getDmlFieldNames(index).size(); fieldNumber++){
                            if (fieldNumber != 0){
                                errorMessage += ',';
                            }
                            errorMessage += e.getDmlFieldNames(index)[fieldNumber].unescapeHtml4(); 
                        }
                        errorMessage += '",'; 
                    }
                    errorMessage += '"error":"'+e.getDmlMessage(index).unescapeHtml4()+'"'; 

                    errorMessage += '}';
                }
            }else{
                errorMessage += '"error":"'+e.getMessage().unescapeHtml4()+'"';
            }
            errorMessage += ']';
        }    
        return errorMessage;
    }
}