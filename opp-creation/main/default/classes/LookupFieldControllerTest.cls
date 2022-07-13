@isTest
public class LookupFieldControllerTest {

    @isTest
    static void testLookupField() {
        List<String> returnFields = new List<String> {'Name'};

        Contact con = new Contact();
        con.LastName = 'test';
        insert con;

        Contact a = [SELECT Id FROM Contact LIMIT 1];

        LookupFieldController.getObjectDetails('Contact');
        LookupFieldController.getRecentRecords('Contact', returnFields, 5);
        LookupFieldController.searchRecords('Contact', returnFields, returnFields, '', 'Name', 'ASC', 5, 'CreatedDate > 2001-01-01T00:00:01Z');
        LookupFieldController.getRecord('Contact', returnFields, a.Id);
    }
}