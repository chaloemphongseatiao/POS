namespace POSApi.Models
{
    public class StatusMessage<T>
    {
        public T data { get; set; }
        public bool success { get; set; }
        public string message { get; set; } 
    }
    public class StatusMessageExt<T>
    {
        public T data { get; set; }
        public bool success { get; set; }
        public string message { get; set; }
        public int page { get; set; }
        public int pagesize { get; set; }
        public int total { get; set; }
        public int totalpage { get; set; }
    }
}
