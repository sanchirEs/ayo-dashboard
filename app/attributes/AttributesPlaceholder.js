import Link from "next/link";

export default function AttributesPlaceholder() {
  // Static tag examples; the real tag CRUD occurs via Add Tags
  const mockAttributes = [
    { id: 1, name: "Popular", values: ["bestseller", "trending", "hot"], createdAt: "2024-01-15" },
    { id: 2, name: "Seasons", values: ["summer", "winter"], createdAt: "2024-01-14" },
    { id: 3, name: "Release", values: ["new", "limited"], createdAt: "2024-01-13" },
  ];

  return (
    <>
      <div className="alert alert-info mb-4" style={{ 
        backgroundColor: '#e3f2fd', 
        border: '1px solid #2196f3', 
        borderRadius: '4px', 
        padding: '12px',
        marginBottom: '20px'
      }}>
        <strong>Note:</strong> Use Add Tags to attach tags to a product. This page is a static example list.
      </div>

      <div className="wg-table table-all-attribute">
        <ul className="table-title flex gap20 mb-14">
          <li>
            <div className="body-title">Tag Group</div>
          </li>
          <li>
            <div className="body-title">Values</div>
          </li>
          <li>
            <div className="body-title">Created Date</div>
          </li>
          <li>
            <div className="body-title">Action</div>
          </li>
        </ul>
        <ul className="flex flex-column">
          {mockAttributes.map((attribute) => (
            <li key={attribute.id} className="attribute-item flex items-center justify-between gap20">
              <div className="name">
                <div className="body-title-2">{attribute.name}</div>
              </div>
              <div className="body-text" style={{ maxWidth: '300px' }}>
                {attribute.values.join(", ")}
              </div>
              <div className="body-text">
                {new Date(attribute.createdAt).toLocaleDateString()}
              </div>
              <div className="list-icon-function">
                <div className="item eye" title="View (Not implemented)">
                  <i className="icon-eye" />
                </div>
                <div className="item edit" title="Edit (Not implemented)">
                  <i className="icon-edit-3" />
                </div>
                <div className="item trash" title="Delete (Not implemented)">
                  <i className="icon-trash-2" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="flex items-center justify-between flex-wrap gap10">
        <div className="text-tiny">Showing {mockAttributes.length} tag groups (static)</div>
      </div>
    </>
  );
}