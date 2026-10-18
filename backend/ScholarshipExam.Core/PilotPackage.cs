namespace ScholarshipExam.Core;

// Public metadata; actual availability is determined by published content and settings.
public sealed record PilotPackage(string Code, string Title, decimal Price, string Currency,
    int ExamCount, int QuestionsPerExam, decimal MarksPerQuestion, int DurationMinutes,
    int PassPercentage, bool PurchasesEnabled)
{
    public static PilotPackage Initial => new("PILOT-5", "ஐந்து பயிற்சித் தேர்வுகள்", 500m,
        "LKR", 5, 40, 2.5m, 60, 60, false);
}

