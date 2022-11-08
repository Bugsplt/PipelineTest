namespace PipelineTest;

public class testClass
{
    //long function
    public int testFunction()
    {
        var x = 1;
        var y = 2;
        var z = 3;
        x = y + z;
        y = x + z;
        z = x + y;
        x = y + z;
        var prime = 0;
        for (var i = x * y * z; i < int.MaxValue; i++)
        {
            for (var j = 2; j < i; j++)
            {
                if (i % j == 0)
                {
                    break;
                }
                if (j == i - 1)
                {
                    prime = i;
                    break;
                }
            }
        }
        return prime * x * y * z;
    }
    ahjhfjbwakf
}