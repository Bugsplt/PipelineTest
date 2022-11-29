using ClassLibrary1;

namespace TestProject1;

[TestClass]
public class UnitTest1
{
    [TestMethod]
    public void TestAddNumbers()
    {
        var buildableClass = new BuildableClass();
        var result = buildableClass.AddNumbers(1, 2);
        Assert.AreEqual(3, result);
    }
}