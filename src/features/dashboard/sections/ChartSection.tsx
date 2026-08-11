import Card from "../../../components/cards/Card";

const ChartsSection = () => {
  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Weekly Calls
            </h3>

            <p className="text-sm text-text-secondary">
              Last 7 days
            </p>
          </div>

          <div className="flex h-72 items-center justify-center rounded-lg bg-background">
            Line Chart
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Monthly Leads
            </h3>

            <p className="text-sm text-text-secondary">
              Current Month
            </p>
          </div>

          <div className="flex h-72 items-center justify-center rounded-lg bg-background">
            Line Chart
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Admissions
            </h3>

            <p className="text-sm text-text-secondary">
              Monthly Trend
            </p>
          </div>

          <div className="flex h-72 items-center justify-center rounded-lg bg-background">
            Bar Chart
          </div>
        </div>
      </Card>
    </section>
  );
};

export default ChartsSection;