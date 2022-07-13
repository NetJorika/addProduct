@IsTest
public class NewOpportunityControllerTest {

    @IsTest
    static void test_getRecordTypes() {
        
        Account acc = new Account(
            Name = 'test'
        );
        insert acc;        
        
        Opportunity opp = new Opportunity();
        opp.Name = 'test';
        opp.CloseDate = Date.today();
        opp.StageName = 'Qualification';
        opp.Type = 'New Customer';
        opp.Description = 'test';
        opp.AccountId = acc.Id;
        insert opp;
        
        Test.startTest();
        List<RecordType> opp2 = NewOpportunityController.getRecordTypes();
        Test.stopTest();    
    }

    @IsTest
    static void test_setOppNameAndAddProduct() {

        Contact con = new Contact();
        con.LastName = 'test';
        insert con;

        Account acc = new Account(
            Name = 'test'
        );
        insert acc;        
        
        Account acc2 = new Account(
            Name = 'test2'
        );
        insert acc2;        

        
        Lead newLead = new Lead();
        newLead.Company = 'test';
        newLead.LastName = 'test';
        newLead.Status = 'Open - Not Contacted';
        newLead.LeadSource = 'Сбербанк';
        insert newLead;
        
        Opportunity opp = new Opportunity();
        opp.Name = 'test';
        opp.CloseDate = Date.today();
        opp.StageName = 'Qualification';
        opp.Type = 'New Customer';
        opp.Description = 'test';
        opp.AccountId = acc.Id;
        insert opp;
        
        Product2 recordProduct = new Product2(Name='testname', 
                                              Description='testDescr', 
                                              Family='ProdFamily');
        insert recordProduct;

        List<OpportunityLineItem> oppItemList = new List<OpportunityLineItem>();
        OpportunityLineItem oppItem = new OpportunityLineItem();
        oppItem.Quantity = 1;
        oppItem.UnitPrice = 1;
        oppItem.Description = 'teqwe';
        oppItem.OpportunityId = opp.Id;
        oppItem.Product2Id = recordProduct.Id;
        oppItemList.add(oppItem);
        
        Test.startTest();
        NewOpportunityController.setOppNameAndAddProduct(opp.Id, oppItemList);
        Test.stopTest();    
    }

    @IsTest
    static void test_getServiceAutonumbered() {
        
        Account acc = new Account(
            Name = 'test'
        );
        insert acc;        
        
        Opportunity opp = new Opportunity();
        opp.Name = 'test';
        opp.CloseDate = Date.today();
        opp.StageName = 'Qualification';
        opp.Type = 'New Customer';
        opp.Description = 'test';
        opp.AccountId = acc.Id;
        insert opp;
        
        Test.startTest();
        Opportunity opp2 = NewOpportunityController.getServiceAutonumbered();
        Account acc2 = NewOpportunityController.getAccount(acc.Id);
        Test.stopTest();    
    }

    
    @IsTest
    static void test_getCurrentUser() {
        Test.startTest();
        User usr = NewOpportunityController.getCurrentUser();
        Test.stopTest();
        System.debug('Current User: ' + usr);
    }
}