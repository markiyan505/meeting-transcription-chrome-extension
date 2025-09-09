import DevContainer from "./DevContainer";
import FloatPanelApp from "../floatpanel/FloatPanelApp";
import MeetPanelDemo from "./MeetPanelDemo";

const DevApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-300">
      <div className="min-w-full min-h-full"></div>

      {/* Meet Panel Demo */}
      <MeetPanelDemo />

      {/* Float Panel Container */}
      {/* <DevContainer>
        <FloatPanelApp />
      </DevContainer> */}
    </div>
  );
};

export default DevApp;
