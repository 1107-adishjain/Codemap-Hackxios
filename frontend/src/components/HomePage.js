import Navbar from "./Navbar";

export default function HomePage() {
  return (
    <>
    <div>
        <Navbar/>
    </div>
     <section className="px-8 py-16 flex flex-col items-start w-full mx-auto bg-teal-800">

        
      <h1 className="text-5xl font-bold text-white mb-4">
        Welcome to <span className="text-teal-300">CODEmap</span>
      </h1>
      <p className="text-xl text-teal-100 mb-8">
        Your ultimate platform for visualizing your code architecture.
      </p>
      <p className="text-teal-100 mb-8 max-w-2xl">
        Transform your codebase into interactive visual maps. Analyze relationships, understand dependencies, <br />
        and explore your software architecture like never before
      </p>
      <div className="flex gap-6 mb-16">
        <button className="bg-teal-500 hover:bg-teal-400 text-white text-xl font-medium px-8 py-4 rounded-md shadow">
          Start Analyze Code
        </button>
        <button className="bg-gray-700 hover:bg-gray-600 text-white text-xl font-medium px-8 py-4 rounded-md shadow">
          Learn More
        </button>
      </div>
      {/* Feature Cards */}
      <div className="flex gap-8 mt-8">
        <div className="bg-teal-800 rounded-lg shadow p-8 flex flex-col items-center w-64">
          <div className="text-3xl font-bold text-teal-300 mb-2">15+</div>
          <div className="text-white font-semibold mb-1">Programming languages</div>
          <div className="text-teal-100 text-center text-sm">supported</div>
        </div>
        <div className="bg-teal-800 rounded-lg shadow p-8 flex flex-col items-center w-64">
          <div className="text-3xl font-bold text-teal-300 mb-2">AST</div>
          <div className="text-white font-semibold mb-1">Abstract Syntax Tree</div>
          <div className="text-teal-100 text-center text-sm">supported.</div>
        </div>
        <div className="bg-teal-800 rounded-lg shadow p-8 flex flex-col items-center w-64">
          <div className="text-3xl font-bold text-teal-300 mb-2">&#8734;</div>
          <div className="text-white font-semibold mb-1">Code Relationships.</div>
        </div>
      </div>
    </section>
    </>
   
  );
}
