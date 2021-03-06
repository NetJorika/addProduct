@isTest
public class AddProductsControllerTest {

    @TestSetup
    static void makeData(){
        
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
        
        //create test product
        Product2 recordProduct = new Product2(Name = 'testname', 
                                              Description = 'testDescr', 
                                              ProductCode = 'T1',
                                              Family = 'ProdFamily');
        insert recordProduct;
        
        //create test price book
        Pricebook2 recordPriceBook = new Pricebook2(IsActive=True, 
                                                    Name = 'testPriceBook');
        insert recordPriceBook;
        
        //create standard pricebook entry
        PricebookEntry recordStandardPricebookEntry = new PricebookEntry(
                                                                         IsActive = true,
                                                                         UnitPrice = 100,
                                                                         Product2Id = recordProduct.Id,
                                                                         Pricebook2Id = Test.getStandardPricebookId());
        insert recordStandardPricebookEntry;
        
        //create custom pricebook entry
        PricebookEntry recordPricebookEntry = new PricebookEntry(
                                                                 IsActive = true,
                                                                 UnitPrice = 100,
                                                                 Product2Id = recordProduct.Id,
                                                                 Pricebook2Id = recordPriceBook.Id);
        insert recordPricebookEntry;        
    }

    @isTest 
    static void testGetPricebookFromOpportunity(){
        Opportunity opp = [SELECT Id, Pricebook2Id FROM Opportunity LIMIT 1 ];
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        opp.Pricebook2Id = pricebook.Id;
        update opp;
        Test.startTest();
        AddProductsController.PricebookResult res = AddProductsController.getPricebookFromOpportunity(opp.Id);
        Test.stopTest();

        System.assertEquals(null, res.pricebookAll, 'getPricebookFromOpportunity: Opportunity PriceBook does not exists');
        System.assertEquals(pricebook.Id, res.pricebookId, 'getPricebookFromOpportunity: not right PriceBook Id');
        System.assertEquals(pricebook.Name, res.pricebookName, 'getPricebookFromOpportunity: not right PriceBook Name');
    }

    @isTest 
    static void testGetPricebookFromOpportunityNone(){
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1 ];
        Test.startTest();
        AddProductsController.PricebookResult res = AddProductsController.getPricebookFromOpportunity(opp.Id);
        Test.stopTest();

        List<Pricebook2> pricebookList = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true];
        Map<String,String> pricebookAll = new Map<String,String>();
        for (Pricebook2 pricebook : pricebookList){
            pricebookAll.put(pricebook.Id, pricebook.Name);
        }

        System.assertEquals(1, res.pricebookAll.size(), 'getPricebookFromOpportunity: PriceBook list must be 1 record size');
        System.assertEquals(null, res.pricebookId, 'getPricebookFromOpportunity: PriceBook Id must be null');
        System.assertEquals(null, res.pricebookName, 'getPricebookFromOpportunity: PriceBook Name must be null');
        System.assertEquals(pricebookAll, res.pricebookAll, 'getPricebookFromOpportunity: PriceBook list must be equal to test list');
    }

    @isTest 
    static void testUpdateOpportunityPricebook(){
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1 ];
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        Test.startTest();
        Boolean res = AddProductsController.updateOpportunityPricebook(opp.Id,pricebook.Id);
        Test.stopTest();

        Opportunity oppRes = [SELECT Id, Pricebook2Id FROM Opportunity LIMIT 1 ];

        System.assertEquals(true, res, 'updateOpportunityPricebook: error on Opportunity Pricebook update');
        System.assertEquals(pricebook.Id, oppRes.Pricebook2Id, 'updateOpportunityPricebook: Pricebook Id must be equal to test Id');
    }

    @isTest 
    static void testUpdateOpportunityPricebookError(){
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1 ];
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        Test.startTest();
        Boolean res = AddProductsController.updateOpportunityPricebook(opp.Id,opp.Id);
        Test.stopTest();

        List<Opportunity> oppRes = [SELECT Id, Pricebook2Id FROM Opportunity WHERE Pricebook2Id = :pricebook.Id  LIMIT 1 ];

        System.assertEquals(false, res, 'updateOpportunityPricebook: Must be an error on Opportunity Pricebook update');
        System.assertEquals(0, oppRes.size(), 'updateOpportunityPricebook: Opportunity with test Pricebook Id must exists');
    }
    
    @isTest
    static void testAddProductsWithoutFilter() {
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        PricebookEntry pricebookEntry = [SELECT Product2Id, Pricebook2Id, Product2.Name, Product2.ProductCode, UnitPrice, Product2.Description, Product2.Family FROM PricebookEntry WHERE Pricebook2Id = :pricebook.Id LIMIT 1];
 
        Test.startTest();
        List<PricebookEntry> result = AddProductsController.getAllProducts(null,pricebook.Id,null,null);

        System.assertEquals(1, result.size(), 'getAllProducts: Product list must be 1 record size');
        System.assertEquals(pricebookEntry, result[0], 'getAllProducts: Product list must equal to test list');
    }
    
    @isTest
    static void testAddProductsFilterName() {
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        PricebookEntry pricebookEntry = [SELECT Product2Id, Pricebook2Id, Product2.Name, Product2.ProductCode, UnitPrice, Product2.Description, Product2.Family FROM PricebookEntry WHERE Pricebook2Id = :pricebook.Id LIMIT 1];
 
        Test.startTest();
        List<PricebookEntry> result = AddProductsController.getAllProducts('testname',pricebook.Id,null,null);
        Test.stopTest();

        System.assertEquals(1, result.size(), 'getAllProducts: Product list must be 1 record size');
        System.assertEquals(pricebookEntry, result[0], 'getAllProducts: Product list must equal to test list');
    }
    
    @isTest
    static void testAddProductsFilterProductCode() {
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        PricebookEntry pricebookEntry = [SELECT Product2Id, Pricebook2Id, Product2.Name, Product2.ProductCode, UnitPrice, Product2.Description, Product2.Family FROM PricebookEntry WHERE Pricebook2Id = :pricebook.Id LIMIT 1];
 
        Test.startTest();
        List<PricebookEntry> result = AddProductsController.getAllProducts(null,pricebook.Id,'T1',null);
        Test.stopTest();

        System.assertEquals(1, result.size(), 'getAllProducts: Product list must be 1 record size');
        System.assertEquals(pricebookEntry, result[0], 'getAllProducts: Product list must equal to test list');
    }
    
    @isTest
    static void testAddProductsFilterFamilies() {
        
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        PricebookEntry pricebookEntry = [SELECT Product2Id, Pricebook2Id, Product2.Name, Product2.ProductCode, UnitPrice, Product2.Description, Product2.Family FROM PricebookEntry WHERE Pricebook2Id = :pricebook.Id LIMIT 1];
 
        Test.startTest();
        List<PricebookEntry> result = AddProductsController.getAllProducts(null,pricebook.Id,null,new List<String> {'ProdFamily'});
        Test.stopTest();

        System.assertEquals(1, result.size(), 'getAllProducts: Product list must be 1 record size');
        System.assertEquals(pricebookEntry, result[0], 'getAllProducts: Product list must equal to test list');
    }
    
    @isTest
    static void testSetOppItems() {
        Opportunity opp = [SELECT Id, Pricebook2Id FROM Opportunity LIMIT 1 ];
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        opp.Pricebook2Id = pricebook.Id;
        update opp;
        PricebookEntry pricebookEntry = [SELECT Product2Id, Pricebook2Id, Product2.Name, Product2.ProductCode, UnitPrice, Product2.Description, Product2.Family FROM PricebookEntry WHERE Pricebook2Id = :pricebook.Id LIMIT 1];
 
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem> ();
        OpportunityLineItem oppItem = new OpportunityLineItem(
            UnitPrice = 1,
            OpportunityId = opp.Id,
            Product2Id = pricebookEntry.Product2Id,
            Quantity = 1,
            Description ='1'
        );
        oppItems.add(oppItem);

        Test.startTest();
        String result = AddProductsController.setOppItems(oppItems);
        Test.stopTest();

        List<OpportunityLineItem> oppTtemsResult = [SELECT Id, UnitPrice, OpportunityId, Product2Id, Quantity, Description FROM OpportunityLineItem WHERE OpportunityId=:opp.Id LIMIT 1];

        System.assertEquals(null, result, 'setOppItems: Errors on Opportunity Line Item Creation');
        System.assertEquals(oppItem.UnitPrice, oppTtemsResult[0].UnitPrice, 'setOppItems: Wrong UnitPrice on Opportunity Line Item');
        System.assertEquals(oppItem.Product2Id, oppTtemsResult[0].Product2Id, 'setOppItems: Wrong Product2Id on Opportunity Line Item');
        System.assertEquals(oppItem.Quantity, oppTtemsResult[0].Quantity, 'setOppItems: Wrong Quantity on Opportunity Line Item');
        System.assertEquals(oppItem.Description, oppTtemsResult[0].Description, 'setOppItems: Wrong Description on Opportunity Line Item');
    }
    
    @isTest
    static void testSetOppItemsError() {
        Opportunity opp = [SELECT Id, Pricebook2Id FROM Opportunity LIMIT 1 ];
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        PricebookEntry pricebookEntry = [SELECT Product2Id, Pricebook2Id, Product2.Name, Product2.ProductCode, UnitPrice, Product2.Description, Product2.Family FROM PricebookEntry WHERE Pricebook2Id = :pricebook.Id LIMIT 1];
 
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem> ();
        OpportunityLineItem oppItem = new OpportunityLineItem(
            UnitPrice = 1,
            OpportunityId = opp.Id,
            Product2Id = pricebookEntry.Product2Id,
            Quantity = 1,
            Description ='1'
        );
        oppItems.add(oppItem);

        Test.startTest();
        String result = AddProductsController.setOppItems(oppItems);
        Test.stopTest();

        List<OpportunityLineItem> oppTtemsResult = [SELECT Id, UnitPrice, OpportunityId, Product2Id, Quantity, Description FROM OpportunityLineItem WHERE OpportunityId=:opp.Id LIMIT 1];

        System.assert(result != null, 'setOppItems: No Errors on Opportunity Line Item Creation');
        System.assertEquals(0, oppTtemsResult.size(), 'setOppItems: new Opportunity LineItem must not exists');
    }

    @isTest
    static void testSetOppItemsErrorRows() {
        Opportunity opp = [SELECT Id, Pricebook2Id FROM Opportunity LIMIT 1 ];
        Pricebook2 pricebook = [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true LIMIT 1];
        opp.Pricebook2Id = pricebook.Id;
        update opp;
        PricebookEntry pricebookEntry = [SELECT Product2Id, Pricebook2Id, Product2.Name, Product2.ProductCode, UnitPrice, Product2.Description, Product2.Family FROM PricebookEntry WHERE Pricebook2Id = :pricebook.Id LIMIT 1];
 
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem> ();

        oppItems.add(new OpportunityLineItem(
            UnitPrice = 0,
            OpportunityId = opp.Id,
            Product2Id = pricebookEntry.Product2Id,
            Quantity = 0,
            Description ='1'
        ));
        oppItems.add(new OpportunityLineItem(
            UnitPrice = 0,
            OpportunityId = opp.Id,
            Product2Id = pricebookEntry.Product2Id,
            Quantity = 0,
            Description ='2'
        ));

        Test.startTest();
        String result = AddProductsController.setOppItems(oppItems);
        Test.stopTest();

        List<OpportunityLineItem> oppTtemsResult = [SELECT Id, UnitPrice, OpportunityId, Product2Id, Quantity, Description FROM OpportunityLineItem WHERE OpportunityId=:opp.Id LIMIT 1];

        System.assert(result != null, 'setOppItems: No Errors on Opportunity Line Item Creation');
        System.assertEquals(0, oppTtemsResult.size(), 'setOppItems: new Opportunity LineItem must not exists');
    }
}